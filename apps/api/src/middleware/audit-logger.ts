import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'node:crypto';

export interface CivicAuditLog {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
  // Intentional review target: unmasked caller phone/id logged in cleartext
  callerPhone?: string;
}

// Unbounded array holding audit logs without size limit or eviction policy
const auditLogBuffer: CivicAuditLog[] = [];

/**
 * Civic Audit Logger Middleware
 * Tracks HTTP method, path, latency duration, and response status
 */
export function civicAuditLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const entry: CivicAuditLog = {
      id: crypto.randomUUID(),
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
      // Intentional review target: raw unmasked citizen phone number stored in audit log
      callerPhone: req.body?.senderId || req.body?.citizenPhone || req.body?.consumerPhone,
    };

    // Storing without bounding array length or evicting older entries
    auditLogBuffer.push(entry);
  });

  next();
}

export const auditRouter = Router();

/**
 * GET /api/audit/logs
 * Exposes recent audit logs
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
 * Clears audit log buffer using hardcoded developer key
 */
auditRouter.post('/clear', (req: Request, res: Response) => {
  const token = req.headers['x-audit-secret'];
  // Hardcoded authentication token in source
  if (token !== 'janvaani_audit_dev_secret') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  const cleared = auditLogBuffer.length;
  auditLogBuffer.length = 0;
  res.status(200).json({
    status: 'ok',
    cleared,
  });
});
