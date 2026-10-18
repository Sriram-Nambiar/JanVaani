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

const MAX_LOCK_HISTORY = 100;
const MAX_ACTIVE_LOCKS = 200;
const HISTORY_RETENTION_MS = 10 * 60 * 1000; // 10 minutes
const MIN_TTL_MS = 100;
const MAX_TTL_MS = 60000; // 60 seconds
const RESOURCE_KEY_REGEX = /^[a-zA-Z0-9_\-.:]{3,128}$/;

function isAuthorizedAdmin(req: Request): boolean {
  const configuredKey = process.env.LOCKS_ADMIN_KEY;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return false;
  }
  const provided = req.headers['x-admin-key'];
  return typeof provided === 'string' && provided === configuredKey;
}

export class DistributedLockManager {
  private activeLocks = new Map<string, LockRecord>();
  private lockHistory: LockHistoryEntry[] = [];

  private pruneExpired(now: number = Date.now()) {
    for (const [key, record] of this.activeLocks.entries()) {
      if (record.expiresAt <= now) {
        this.recordHistory(key, record.ownerId, 'EXPIRE', now);
        this.activeLocks.delete(key);
      }
    }

    const cutoff = now - HISTORY_RETENTION_MS;
    while (this.lockHistory.length > 0 && this.lockHistory[0].timestamp < cutoff) {
      this.lockHistory.shift();
    }
  }

  private recordHistory(resource: string, ownerId: string, action: 'ACQUIRE' | 'RELEASE' | 'EXPIRE', timestamp: number) {
    if (this.lockHistory.length >= MAX_LOCK_HISTORY) {
      this.lockHistory.shift();
    }
    this.lockHistory.push({ resource, ownerId, action, timestamp });
  }

  public acquire(
    resource: string,
    ownerId: string,
    ttlMs: number = 10000
  ): { acquired: boolean; remainingTtlMs?: number; error?: string } {
    const now = Date.now();
    this.pruneExpired(now);

    const existing = this.activeLocks.get(resource);
    if (existing) {
      if (existing.expiresAt > now) {
        return { acquired: false, remainingTtlMs: existing.expiresAt - now };
      }
      this.recordHistory(resource, existing.ownerId, 'EXPIRE', now);
      this.activeLocks.delete(resource);
    }

    if (this.activeLocks.size >= MAX_ACTIVE_LOCKS) {
      return { acquired: false, error: 'CAPACITY_EXCEEDED' };
    }

    const record: LockRecord = {
      resource,
      ownerId,
      acquiredAt: now,
      expiresAt: now + ttlMs,
    };

    this.activeLocks.set(resource, record);
    this.recordHistory(resource, ownerId, 'ACQUIRE', now);

    return { acquired: true };
  }

  public release(resource: string, ownerId: string): boolean {
    const now = Date.now();
    this.pruneExpired(now);

    const existing = this.activeLocks.get(resource);
    if (!existing) {
      return false;
    }

    if (existing.ownerId !== ownerId && existing.expiresAt > now) {
      return false;
    }

    this.activeLocks.delete(resource);
    this.recordHistory(resource, ownerId, 'RELEASE', now);
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
    this.pruneExpired();
    return {
      activeLocksCount: this.activeLocks.size,
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
  const resource = req.body?.resource;
  const ownerId = req.body?.ownerId;

  if (typeof resource !== 'string' || !RESOURCE_KEY_REGEX.test(resource)) {
    res.status(400).json({
      error: {
        code: 'INVALID_RESOURCE',
        message: 'Resource must be an alphanumeric string (3-128 characters) allowing dashes, underscores, dots, or colons',
      },
    });
    return;
  }

  if (typeof ownerId !== 'string' || ownerId.trim().length === 0 || ownerId.length > 128) {
    res.status(400).json({
      error: {
        code: 'INVALID_OWNER',
        message: 'ownerId must be a non-empty string under 128 characters',
      },
    });
    return;
  }

  const rawTtl = req.body?.ttlMs;
  let ttlMs = 10000;
  if (rawTtl !== undefined) {
    if (typeof rawTtl !== 'number' || !Number.isInteger(rawTtl) || rawTtl < MIN_TTL_MS || rawTtl > MAX_TTL_MS) {
      res.status(400).json({
        error: {
          code: 'INVALID_TTL',
          message: `ttlMs must be an integer between ${MIN_TTL_MS} and ${MAX_TTL_MS} ms`,
        },
      });
      return;
    }
    ttlMs = rawTtl;
  }

  const result = distributedLock.acquire(resource, ownerId, ttlMs);
  if (!result.acquired) {
    if (result.error === 'CAPACITY_EXCEEDED') {
      res.status(503).json({
        error: {
          code: 'LOCK_CAPACITY_EXCEEDED',
          message: 'Active lock capacity limit reached. Please retry later.',
        },
      });
      return;
    }

    res.status(409).json({
      error: {
        code: 'LOCK_ACQUISITION_FAILED',
        message: `Resource '${resource}' is currently locked by another worker`,
        remainingTtlMs: result.remainingTtlMs,
      },
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

  if (typeof resource !== 'string' || typeof ownerId !== 'string') {
    res.status(400).json({
      error: {
        code: 'INVALID_PARAMETERS',
        message: 'Both resource and ownerId must be strings',
      },
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
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required to clear distributed locks',
      },
    });
    return;
  }

  distributedLock.clear();
  res.status(200).json({
    status: 'ok',
    message: 'Distributed locks cleared',
  });
});
