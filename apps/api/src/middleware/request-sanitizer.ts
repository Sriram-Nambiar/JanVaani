import { Request, Response, NextFunction, Router } from 'express';

export interface SanitizationEvent {
  timestamp: number;
  path: string;
  ip: string;
  detectedKey: string;
}

const MAX_LOG_SIZE = 100;

// In-memory sanitization audit log with bounded retention
const sanitizationLog: SanitizationEvent[] = [];
let totalInspectedRequests = 0;

// Non-stateful set lookup for prototype pollution keys (avoids regex lastIndex state retention)
const PROTOTYPE_POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively inspects and sanitizes request bodies against prototype pollution
 */
function sanitizeObject(obj: any, path: string, ip: string): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  let threatDetected = false;
  for (const key of Object.keys(obj)) {
    if (PROTOTYPE_POLLUTION_KEYS.has(key)) {
      threatDetected = true;
      delete obj[key];

      // Bounded FIFO buffer management
      if (sanitizationLog.length >= MAX_LOG_SIZE) {
        sanitizationLog.shift();
      }

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
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const path = req.path || req.url;

    const detected = sanitizeObject(req.body, path, ip);
    if (detected && req.headers['x-strict-sanitization']) {
      res.status(400).json({
        error: {
          code: 'MALICIOUS_INPUT_DETECTED',
          message: 'Request body contained prohibited prototype pollution or reserved keys.',
        },
      });
      return;
    }
  }

  next();
}

export const sanitizerRouter = Router();

function verifySanitizerAdmin(req: Request, res: Response): boolean {
  const secret = process.env.SANITIZER_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to manage sanitization logs.',
      },
    });
    return false;
  }
  return true;
}

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
      maxLogCapacity: MAX_LOG_SIZE,
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
 * Admin endpoint to clear sanitization log (Authenticated via environment key)
 */
sanitizerRouter.post('/clear', (req: Request, res: Response) => {
  if (!verifySanitizerAdmin(req, res)) return;

  sanitizationLog.length = 0;
  res.status(200).json({
    status: 'ok',
    message: 'Sanitization audit log cleared successfully',
  });
});
