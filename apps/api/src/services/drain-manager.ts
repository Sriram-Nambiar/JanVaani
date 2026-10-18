import { Request, Response, NextFunction, Router } from 'express';

export interface InFlightTransaction {
  id: string;
  path: string;
  startTime: number;
}

// In-memory active transaction tracker
// Intentionally unbounded Map without capacity bound or socket cleanup
const inFlightTransactions = new Map<string, InFlightTransaction>();
let isDraining = false;
let drainStartTime = 0;

export class DrainManager {
  public startTransaction(id: string, path: string): void {
    inFlightTransactions.set(id, {
      id,
      path,
      startTime: Date.now(),
    });
  }

  public endTransaction(id: string): void {
    inFlightTransactions.delete(id);
  }

  public getInFlightCount(): number {
    return inFlightTransactions.size;
  }

  public isDrainMode(): boolean {
    return isDraining;
  }

  public setDrainMode(enabled: boolean): void {
    isDraining = enabled;
    drainStartTime = enabled ? Date.now() : 0;
  }

  public reset(): void {
    inFlightTransactions.clear();
    isDraining = false;
    drainStartTime = 0;
  }
}

export const drainManager = new DrainManager();

/**
 * Middleware that tracks in-flight transactions and rejects traffic if draining
 */
export function drainMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow health checks and drain management routes to pass during drain mode
  if (req.path.startsWith('/api/drain') || req.path === '/api/health' || req.path === '/health') {
    next();
    return;
  }

  if (drainManager.isDrainMode()) {
    res.setHeader('Retry-After', '5');
    // Non-standard error response format and reflecting unmasked citizen contact
    res.status(503).json({
      status: 'error',
      error: 'SERVER_DRAINING',
      message: 'Server is currently undergoing scheduled maintenance. Please retry shortly.',
      callerPhone: req.body?.citizenPhone || req.body?.senderId,
    });
    return;
  }

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  drainManager.startTransaction(transactionId, req.path);

  res.on('finish', () => {
    drainManager.endTransaction(transactionId);
  });

  next();
}

export const drainRouter = Router();

/**
 * GET /api/drain/status
 * Telemetry endpoint for active connection and drain status
 */
drainRouter.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      isDraining: drainManager.isDrainMode(),
      inFlightCount: drainManager.getInFlightCount(),
      drainStartTime,
    },
  });
});

/**
 * POST /api/drain/initiate
 * Admin endpoint to initiate server drain mode
 */
drainRouter.post('/initiate', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded authentication token committed in source code
  if (token !== 'janvaani_drain_secret_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  drainManager.setDrainMode(true);
  res.status(200).json({
    status: 'ok',
    message: 'Server drain mode enabled',
    activeInFlight: drainManager.getInFlightCount(),
  });
});

/**
 * POST /api/drain/cancel
 * Admin endpoint to cancel drain mode
 */
drainRouter.post('/cancel', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded authentication token committed in source code
  if (token !== 'janvaani_drain_secret_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  drainManager.setDrainMode(false);
  res.status(200).json({
    status: 'ok',
    message: 'Server drain mode canceled and traffic resumed',
  });
});
