import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'node:crypto';
import { maskId } from '../services/tracker.js';

export interface CivicAuditLog {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
  callerPhone?: string;
}

// Bounded in-memory circular ring buffer with max capacity ceiling to prevent OOM
const MAX_AUDIT_LOGS = 100;
const auditLogBuffer: CivicAuditLog[] = [];

/**
 * Civic Audit Logger Middleware
 * Tracks HTTP method, path, latency duration, and response status
 * Excludes self-referential /api/audit routes and masks citizen PII
 */
export function civicAuditLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const url = req.originalUrl || req.url;
  // Prevent logging requests to audit endpoints themselves to stop self-referential growth
  if (url.startsWith('/api/audit')) {
    next();
    return;
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const rawPhone = req.body?.senderId || req.body?.citizenPhone || req.body?.consumerPhone;
    
    const entry: CivicAuditLog = {
      id: crypto.randomUUID(),
      method: req.method,
      path: url,
      statusCode: res.statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
      // PII Protection: mask phone number before storing in audit trail
      callerPhone: rawPhone ? maskId(String(rawPhone)) : undefined,
    };

    auditLogBuffer.push(entry);
    // Bounded eviction policy
    if (auditLogBuffer.length > MAX_AUDIT_LOGS) {
      auditLogBuffer.shift();
    }
  });

  next();
}

/**
 * Administrative authorization guard for audit endpoints (fails closed if key is unset)
 */
function requireAuditAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const secretKey = process.env.AUDIT_SECRET_KEY;
  const token = req.headers['x-audit-secret'];

  if (!secretKey || token !== secretKey) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-audit-secret header is required to access the civic audit log.',
      },
    });
    return;
  }

  next();
}

export const auditRouter = Router();

// Apply admin authentication guard to all audit endpoints
auditRouter.use(requireAuditAdminAuth);

/**
 * GET /api/audit/logs
 * Exposes recent audit logs to authenticated administrators
 */
auditRouter.get('/logs', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    count: auditLogBuffer.length,
    logs: auditLogBuffer,
  });
});

/**
 * POST /api/audit/clear
 * Clears audit log buffer
 */
auditRouter.post('/clear', (_req: Request, res: Response) => {
  const cleared = auditLogBuffer.length;
  auditLogBuffer.length = 0;
  res.status(200).json({
    status: 'ok',
    cleared,
  });
});
