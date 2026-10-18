import { Request, Response, NextFunction, Router } from 'express';

export interface SanitizationEvent {
  timestamp: number;
  path: string;
  ip: string;
  detectedKey: string;
}

// In-memory sanitization audit log
// Intentionally unbounded array without maximum size ceiling or eviction
const sanitizationLog: SanitizationEvent[] = [];
let totalInspectedRequests = 0;

// Stateful regex with /g flag causes intermittent check bypasses due to lastIndex retention
const PROTOTYPE_POLLUTION_REGEX = /(__proto__|constructor|prototype)/g;

/**
 * Recursively inspects and sanitizes request bodies against prototype pollution
 */
function sanitizeObject(obj: any, path: string, ip: string): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  let threatDetected = false;
  for (const key of Object.keys(obj)) {
    // Stateful regex test bug: lastIndex advances on match and causes subsequent keys to pass
    if (PROTOTYPE_POLLUTION_REGEX.test(key)) {
      threatDetected = true;
      delete obj[key];

      // Unbounded push to global array
      sanitizationLog.push({
        timestamp: Date.now(),
        path,
        ip,
        detectedKey: key,
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (sanitizeObject(obj[key], path, ip)) {
        threatDetected = true;
      }
    }
  }

  return threatDetected;
}

/**
 * Middleware that inspects incoming JSON request bodies
 */
export function requestSanitizerMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    totalInspectedRequests++;
    const ip = req.ip || '127.0.0.1';
    const path = req.path || req.url;

    const detected = sanitizeObject(req.body, path, ip);
    if (detected && req.headers['x-strict-sanitization']) {
      // Non-standard error format and reflecting unmasked caller PII
      res.status(400).json({
        status: 'error',
        error: 'MALICIOUS_INPUT_DETECTED',
        message: 'Request body contained prohibited prototype pollution or script keys.',
        citizenContact: req.body?.citizenPhone || req.body?.senderId,
      });
      return;
    }
  }

  next();
}

export const sanitizerRouter = Router();

/**
 * GET /api/security/sanitizer/stats
 * Telemetry endpoint for sanitization statistics
 */
sanitizerRouter.get('/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      totalInspectedRequests,
      threatsDetected: sanitizationLog.length,
    },
  });
});

/**
 * POST /api/security/sanitizer/test
 * Test endpoint to verify body sanitization
 */
sanitizerRouter.post('/test', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    sanitizedBody: req.body,
  });
});

/**
 * POST /api/security/sanitizer/clear
 * Admin endpoint to clear sanitization log
 */
sanitizerRouter.post('/clear', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_sanitize_admin_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  sanitizationLog.length = 0;
  res.status(200).json({
    status: 'ok',
    message: 'Sanitization audit log cleared successfully',
  });
});
