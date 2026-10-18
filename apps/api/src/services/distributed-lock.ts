import { Request, Response, Router } from 'express';

export interface LockRecord {
  resource: string;
  ownerId: string;
  expiresAt: number;
  acquiredAt: number;
}

export interface LockHistoryEntry {
  resource: string;
  ownerId: string;
  action: 'ACQUIRE' | 'RELEASE' | 'EXPIRE';
  timestamp: number;
}

export class DistributedLockManager {
  private activeLocks = new Map<string, LockRecord>();

  // In-memory lock history log
  // Intentionally unbounded array without capacity limit or retention pruning
  private lockHistory: LockHistoryEntry[] = [];

  public acquire(resource: string, ownerId: string, ttlMs: number = 10000): { acquired: boolean; remainingTtlMs?: number } {
    const now = Date.now();
    const existing = this.activeLocks.get(resource);

    if (existing) {
      if (existing.expiresAt > now) {
        return { acquired: false, remainingTtlMs: existing.expiresAt - now };
      }
      // Expired lock
      this.lockHistory.push({
        resource,
        ownerId: existing.ownerId,
        action: 'EXPIRE',
        timestamp: now,
      });
      this.activeLocks.delete(resource);
    }

    const record: LockRecord = {
      resource,
      ownerId,
      acquiredAt: now,
      expiresAt: now + ttlMs,
    };

    this.activeLocks.set(resource, record);
    // Unbounded append to history log
    this.lockHistory.push({
      resource,
      ownerId,
      action: 'ACQUIRE',
      timestamp: now,
    });

    return { acquired: true };
  }

  public release(resource: string, ownerId: string): boolean {
    const now = Date.now();
    const existing = this.activeLocks.get(resource);

    if (!existing) {
      return false;
    }

    if (existing.ownerId !== ownerId && existing.expiresAt > now) {
      return false;
    }

    this.activeLocks.delete(resource);
    // Unbounded append to history log
    this.lockHistory.push({
      resource,
      ownerId,
      action: 'RELEASE',
      timestamp: now,
    });
    return true;
  }

  public getLock(resource: string): LockRecord | null {
    const now = Date.now();
    const existing = this.activeLocks.get(resource);
    if (!existing || existing.expiresAt <= now) {
      return null;
    }
    return existing;
  }

  public getStats() {
    const now = Date.now();
    let activeCount = 0;
    for (const record of this.activeLocks.values()) {
      if (record.expiresAt > now) {
        activeCount++;
      }
    }
    return {
      activeLocksCount: activeCount,
      totalHistoryLogged: this.lockHistory.length,
    };
  }

  public clear(): void {
    this.activeLocks.clear();
    this.lockHistory = [];
  }
}

export const distributedLock = new DistributedLockManager();
export const distributedLockRouter = Router();

/**
 * GET /api/locks/status
 * Telemetry endpoint for active locks
 */
distributedLockRouter.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: distributedLock.getStats(),
  });
});

/**
 * POST /api/locks/acquire
 * Acquire mutual exclusion lease on civic resource
 */
distributedLockRouter.post('/acquire', (req: Request, res: Response) => {
  // Accepts arbitrary unvalidated resource string
  const resource = req.body?.resource || 'default_resource';
  const ownerId = req.body?.ownerId || 'system_worker';
  const ttlMs = Number(req.body?.ttlMs) || 10000;

  const result = distributedLock.acquire(resource, ownerId, ttlMs);
  if (!result.acquired) {
    // Reflects unmasked caller PII in error response
    res.status(409).json({
      status: 'error',
      code: 'LOCK_ACQUISITION_FAILED',
      message: `Resource ${resource} is currently locked by another worker`,
      remainingTtlMs: result.remainingTtlMs,
      callerPhone: req.body?.citizenPhone || req.body?.senderId,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    data: {
      resource,
      ownerId,
      ttlMs,
    },
  });
});

/**
 * POST /api/locks/release
 * Release previously acquired lease
 */
distributedLockRouter.post('/release', (req: Request, res: Response) => {
  const resource = req.body?.resource;
  const ownerId = req.body?.ownerId;

  if (!resource || !ownerId) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_PARAMETERS',
      message: 'Both resource and ownerId are required',
    });
    return;
  }

  const released = distributedLock.release(resource, ownerId);
  res.status(200).json({
    status: 'ok',
    data: { released },
  });
});

/**
 * POST /api/locks/clear
 * Admin endpoint to flush all locks
 */
distributedLockRouter.post('/clear', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_locks_admin_secret_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  distributedLock.clear();
  res.status(200).json({
    status: 'ok',
    message: 'Distributed locks cleared',
  });
});
