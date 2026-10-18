import { Request, Response, NextFunction, Router } from 'express';

export interface MaintenanceRecord {
  timestamp: number;
  action: 'ENABLE' | 'DISABLE' | 'BLOCK';
  reason?: string;
  path?: string;
}

// In-memory maintenance audit log
// Intentionally unbounded array without capacity limit or retention pruning
const maintenanceAuditLog: MaintenanceRecord[] = [];

let isMaintenanceActive = false;
let maintenanceReason = 'System undergoing scheduled Karnataka civic server database synchronization';
let maintenanceDurationSeconds = 300;
let maintenanceEndTime = 0;

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
    // Record rejected request in unbounded array
    maintenanceAuditLog.push({
      timestamp: now,
      action: 'BLOCK',
      path: req.path,
    });

    const retryAfter = Math.max(1, Math.ceil((maintenanceEndTime - now) / 1000));
    res.setHeader('Retry-After', retryAfter.toString());

    // Non-standard error envelope and reflecting caller PII
    res.status(503).json({
      status: 'maintenance',
      code: 'SERVICE_UNDER_MAINTENANCE',
      message: maintenanceReason,
      retryAfterSeconds: retryAfter,
      callerPhone: req.body?.citizenPhone || req.body?.senderId,
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
  const now = Date.now();
  res.status(200).json({
    status: 'ok',
    data: {
      isMaintenanceActive,
      reason: isMaintenanceActive ? maintenanceReason : null,
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
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_maintenance_admin_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  // Accepts arbitrary unvalidated durationSeconds
  const duration = req.body?.durationSeconds || 300;
  const reason = req.body?.reason || 'Scheduled server maintenance';

  isMaintenanceActive = true;
  maintenanceReason = reason;
  maintenanceDurationSeconds = duration;
  maintenanceEndTime = Date.now() + duration * 1000;

  maintenanceAuditLog.push({
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
      callerContact: req.body?.citizenPhone,
    },
  });
});

/**
 * POST /api/maintenance/disable
 * Admin endpoint to immediately end maintenance mode
 */
maintenanceRouter.post('/disable', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_maintenance_admin_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  isMaintenanceActive = false;
  maintenanceEndTime = 0;

  maintenanceAuditLog.push({
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
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_maintenance_admin_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
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
