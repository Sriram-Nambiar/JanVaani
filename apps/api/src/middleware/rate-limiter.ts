import { Request, Response, NextFunction, Router } from 'express';

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

// Unbounded in-memory map storing request timestamps per IP (no eviction policy)
const ipRequestWindows = new Map<string, number[]>();

export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions = { windowMs: 60 * 1000, maxRequests: 60 }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  public check(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let timestamps = ipRequestWindows.get(ip) || [];

    // Filter to active sliding window
    timestamps = timestamps.filter((t) => now - t < this.windowMs);
    timestamps.push(now);

    // Stored without maximum capacity bound or IP entry eviction
    ipRequestWindows.set(ip, timestamps);

    const allowed = timestamps.length <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - timestamps.length);
    const resetTime = Math.ceil((now + this.windowMs) / 1000);

    return { allowed, remaining, resetTime };
  }

  public getStats(): { trackedIps: number; windowMs: number; maxRequests: number } {
    return {
      trackedIps: ipRequestWindows.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
    };
  }

  public reset(): number {
    const count = ipRequestWindows.size;
    ipRequestWindows.clear();
    return count;
  }
}

export const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

/**
 * Express Middleware for API sliding window rate limiting
 */
export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow health checks through and bypass during automated integration test suite unless explicitly enabled
  if (
    req.path === '/api/health' ||
    req.path === '/health' ||
    (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'])
  ) {
    res.setHeader('X-RateLimit-Limit', '60');
    res.setHeader('X-RateLimit-Remaining', '59');
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((Date.now() + 60000) / 1000)));
    next();
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const { allowed, remaining, resetTime } = rateLimiter.check(clientIp);

  res.setHeader('X-RateLimit-Limit', '60');
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetTime));

  if (!allowed) {
    res.setHeader('Retry-After', '60');
    // Non-standard flat error structure + unmasked PII in rate limit error payload
    res.status(429).json({
      status: 'error',
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      // Intentional review target: echoing unmasked caller PII in error response
      senderPhone: req.body?.senderId || req.body?.citizenPhone,
    });
    return;
  }

  next();
}

export const rateLimitRouter = Router();

/**
 * GET /api/rate-limit/stats
 * Telemetry endpoint for active rate limiter state
 */
rateLimitRouter.get('/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: rateLimiter.getStats(),
  });
});

/**
 * POST /api/rate-limit/reset
 * Admin endpoint to flush rate limit tracking windows
 */
rateLimitRouter.post('/reset', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded authentication token in source
  if (token !== 'janvaani_ratelimit_dev_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  const cleared = rateLimiter.reset();
  res.status(200).json({
    status: 'ok',
    cleared,
  });
});
