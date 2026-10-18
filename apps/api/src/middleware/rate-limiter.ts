import { Request, Response, NextFunction, Router } from 'express';

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  maxCapacity?: number;
}

// Bounded in-memory map storing request timestamps per IP with automatic eviction
const MAX_TRACKED_IPS = 1000;
const ipRequestWindows = new Map<string, number[]>();

export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly maxCapacity: number;

  constructor(options: RateLimiterOptions = { windowMs: 60 * 1000, maxRequests: 60, maxCapacity: MAX_TRACKED_IPS }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxCapacity = options.maxCapacity || MAX_TRACKED_IPS;
  }

  /**
   * Prunes expired timestamps and evicts inactive IPs
   */
  private prune(): void {
    const now = Date.now();
    for (const [ip, timestamps] of ipRequestWindows.entries()) {
      const active = timestamps.filter((t) => now - t < this.windowMs);
      if (active.length === 0) {
        ipRequestWindows.delete(ip);
      } else {
        ipRequestWindows.set(ip, active);
      }
    }
  }

  public check(ip: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    let timestamps = ipRequestWindows.get(ip) || [];

    // Filter to active sliding window
    timestamps = timestamps.filter((t) => now - t < this.windowMs);

    const allowed = timestamps.length < this.maxRequests;
    if (allowed) {
      timestamps.push(now);

      // Enforce capacity bounds: if map reaches maxCapacity, evict oldest IP entry
      if (ipRequestWindows.size >= this.maxCapacity && !ipRequestWindows.has(ip)) {
        const oldestIp = ipRequestWindows.keys().next().value;
        if (oldestIp) {
          ipRequestWindows.delete(oldestIp);
        }
      }

      ipRequestWindows.set(ip, timestamps);
    }

    const remaining = Math.max(0, this.maxRequests - timestamps.length);
    const oldestTimestamp = timestamps[0] || now;
    const resetTime = Math.ceil((oldestTimestamp + this.windowMs) / 1000);
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + this.windowMs - now) / 1000));

    return { allowed, remaining, resetTime, retryAfterSeconds };
  }

  public getStats(): { trackedIps: number; windowMs: number; maxRequests: number } {
    this.prune();
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
  maxRequests: 500, // Generous baseline ensuring automated tests and normal civic traffic proceed smoothly
  maxCapacity: MAX_TRACKED_IPS,
});

/**
 * Express Middleware for API sliding window rate limiting
 * Skips health checks and administrative /api/rate-limit endpoints to prevent self-throttling
 */
export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl || req.url;

  // Bypass health and administrative rate-limit endpoints so operator cannot be locked out
  if (path.startsWith('/api/rate-limit') || path.startsWith('/api/health') || path === '/health') {
    next();
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const { allowed, remaining, resetTime, retryAfterSeconds } = rateLimiter.check(clientIp);

  res.setHeader('X-RateLimit-Limit', '500');
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetTime));

  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
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
 * Authenticated via environment secret (fails closed if RATE_LIMIT_ADMIN_KEY is unset)
 */
rateLimitRouter.post('/reset', (req: Request, res: Response) => {
  const secret = process.env.RATE_LIMIT_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to reset rate limits.',
      },
    });
    return;
  }

  const cleared = rateLimiter.reset();
  res.status(200).json({
    status: 'ok',
    cleared,
  });
});
