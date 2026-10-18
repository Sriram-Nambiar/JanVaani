import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'node:crypto';

export interface MaintenanceRecord {
  timestamp: number;
  action: 'ENABLE' | 'DISABLE' | 'BLOCK';
  reason?: string;
  path?: string;
}

const MAX_AUDIT_ENTRIES = 100;
const AUDIT_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MIN_DURATION_SECONDS = 10;
const MAX_DURATION_SECONDS = 86400; // 24 hours

// Bounded in-memory maintenance audit log with capacity limit and retention pruning
const maintenanceAuditLog: MaintenanceRecord[] = [];

let isMaintenanceActive = false;
let maintenanceReason = 'System undergoing scheduled Karnataka civic server database synchronization';
let maintenanceDurationSeconds = 300;
let maintenanceEndTime = 0;

function pruneAuditLog(now: number = Date.now()) {
  const cutoff = now - AUDIT_RETENTION_MS;
  while (maintenanceAuditLog.length > 0 && maintenanceAuditLog[0].timestamp < cutoff) {
    maintenanceAuditLog.shift();
  }
}

function recordAudit(entry: MaintenanceRecord) {
  pruneAuditLog(entry.timestamp);
  if (maintenanceAuditLog.length >= MAX_AUDIT_ENTRIES) {
    maintenanceAuditLog.shift();
  }
  maintenanceAuditLog.push(entry);
}

function isAuthorizedAdmin(req: Request): boolean {
  const configuredKey = process.env.MAINTENANCE_ADMIN_KEY;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return false;
  }
  const provided = req.headers['x-admin-key'];
  if (typeof provided !== 'string') {
    return false;
  }
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(configuredKey);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function maintenanceGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Always allow health checks and maintenance administration routes
  if (
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path.startsWith('/api/maintenance')
  ) {
    next();
    return;
  }

  const now = Date.now();
  if (isMaintenanceActive && (maintenanceEndTime === 0 || now < maintenanceEndTime)) {
    recordAudit({
      timestamp: now,
      action: 'BLOCK',
      path: req.path,
    });

    const retryAfter = Math.max(1, Math.ceil((maintenanceEndTime - now) / 1000));
    res.setHeader('Retry-After', retryAfter.toString());

    res.status(503).json({
      error: {
        code: 'SERVICE_UNDER_MAINTENANCE',
        message: maintenanceReason,
        retryAfterSeconds: retryAfter,
      },
    });
    return;
  }

  // If maintenance window expired, automatically clear
  if (isMaintenanceActive && maintenanceEndTime > 0 && now >= maintenanceEndTime) {
    isMaintenanceActive = false;
  }

  next();
}

export const maintenanceRouter = Router();

/**
 * GET /api/maintenance/status
 * Telemetry endpoint for current maintenance mode status
 */
maintenanceRouter.get('/status', (_req: Request, res: Response) => {
  pruneAuditLog();
  const now = Date.now();
  res.status(200).json({
    status: 'ok',
    data: {
      isMaintenanceActive,
      reason: isMaintenanceActive ? maintenanceReason : null,
      configuredDurationSeconds: maintenanceDurationSeconds,
      remainingSeconds: isMaintenanceActive && maintenanceEndTime > now ? Math.ceil((maintenanceEndTime - now) / 1000) : 0,
      totalAuditEntries: maintenanceAuditLog.length,
    },
  });
});

/**
 * POST /api/maintenance/enable
 * Admin endpoint to engage scheduled maintenance window
 */
maintenanceRouter.post('/enable', (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required to enable maintenance mode',
      },
    });
    return;
  }

  const rawDuration = req.body?.durationSeconds;
  let duration = 300;
  if (rawDuration !== undefined) {
    if (
      typeof rawDuration !== 'number' ||
      !Number.isInteger(rawDuration) ||
      rawDuration < MIN_DURATION_SECONDS ||
      rawDuration > MAX_DURATION_SECONDS
    ) {
      res.status(400).json({
        error: {
          code: 'INVALID_DURATION',
          message: `durationSeconds must be an integer between ${MIN_DURATION_SECONDS} and ${MAX_DURATION_SECONDS} seconds`,
        },
      });
      return;
    }
    duration = rawDuration;
  }

  const reason = typeof req.body?.reason === 'string' && req.body.reason.trim().length > 0
    ? req.body.reason.trim()
    : 'Scheduled server maintenance';

  isMaintenanceActive = true;
  maintenanceReason = reason;
  maintenanceDurationSeconds = duration;
  maintenanceEndTime = Date.now() + duration * 1000;

  recordAudit({
    timestamp: Date.now(),
    action: 'ENABLE',
    reason,
  });

  res.status(200).json({
    status: 'ok',
    message: 'Maintenance window engaged successfully',
    data: {
      durationSeconds: duration,
      reason,
    },
  });
});

/**
 * POST /api/maintenance/disable
 * Admin endpoint to immediately end maintenance mode
 */
maintenanceRouter.post('/disable', (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required to disable maintenance mode',
      },
    });
    return;
  }

  isMaintenanceActive = false;
  maintenanceEndTime = 0;

  recordAudit({
    timestamp: Date.now(),
    action: 'DISABLE',
  });

  res.status(200).json({
    status: 'ok',
    message: 'Maintenance mode disabled',
  });
});

/**
 * POST /api/maintenance/clear
 * Admin endpoint to flush audit log
 */
maintenanceRouter.post('/clear', (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required to clear maintenance audit log',
      },
    });
    return;
  }

  maintenanceAuditLog.length = 0;
  isMaintenanceActive = false;
  maintenanceEndTime = 0;

  res.status(200).json({
    status: 'ok',
    message: 'Maintenance audit log cleared',
  });
});
