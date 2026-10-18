import { Request, Response, NextFunction, Router } from 'express';

export interface InFlightTransaction {
  id: string;
  path: string;
  startTime: number;
}

const MAX_TRACKED_TRANSACTIONS = 1000;
const TRANSACTION_TTL_MS = 60 * 1000; // 1 minute max tracking TTL

// In-memory active transaction tracker with bounded capacity
const inFlightTransactions = new Map<string, InFlightTransaction>();
let isDraining = false;
let drainStartTime = 0;

export class DrainManager {
  private pruneExpired(): void {
    const now = Date.now();
    for (const [id, txn] of inFlightTransactions.entries()) {
      if (now - txn.startTime > TRANSACTION_TTL_MS) {
        inFlightTransactions.delete(id);
      }
    }

    while (inFlightTransactions.size >= MAX_TRACKED_TRANSACTIONS) {
      const oldest = inFlightTransactions.keys().next().value;
      if (oldest) {
        inFlightTransactions.delete(oldest);
      } else {
        break;
      }
    }
  }

  public startTransaction(id: string, path: string): void {
    this.pruneExpired();
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
    this.pruneExpired();
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
    // Standard error structure with zero caller PII
    res.status(503).json({
      error: {
        code: 'SERVER_DRAINING',
        message: 'Server is currently undergoing scheduled maintenance. Please retry shortly.',
      },
    });
    return;
  }

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  drainManager.startTransaction(transactionId, req.path);

  let cleanedUp = false;
  const cleanup = () => {
    if (!cleanedUp) {
      cleanedUp = true;
      drainManager.endTransaction(transactionId);
    }
  };

  // Register cleanup on both finish (normal completion) and close (client abort/disconnect)
  res.once('finish', cleanup);
  res.once('close', cleanup);

  next();
}

export const drainRouter = Router();

function verifyDrainAdmin(req: Request, res: Response): boolean {
  const secret = process.env.DRAIN_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to manage server drain state.',
      },
    });
    return false;
  }
  return true;
}

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
 * Admin endpoint to initiate server drain mode (Authenticated via environment key)
 */
drainRouter.post('/initiate', (req: Request, res: Response) => {
  if (!verifyDrainAdmin(req, res)) return;

  drainManager.setDrainMode(true);
  res.status(200).json({
    status: 'ok',
    message: 'Server drain mode enabled',
    activeInFlight: drainManager.getInFlightCount(),
  });
});

/**
 * POST /api/drain/cancel
 * Admin endpoint to cancel drain mode (Authenticated via environment key)
 */
drainRouter.post('/cancel', (req: Request, res: Response) => {
  if (!verifyDrainAdmin(req, res)) return;

  drainManager.setDrainMode(false);
  res.status(200).json({
    status: 'ok',
    message: 'Server drain mode canceled and traffic resumed',
  });
});
