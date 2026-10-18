/**
 * WhatsApp Webhook Idempotency & Deduplication Engine
 * 
 * Prevents redundant processing of retried WhatsApp webhooks or duplicate user transmissions.
 * Supports Redis distributed atomic locking with automatic sliding TTL, falling back
 * to in-memory sliding TTL window with maximum capacity eviction.
 */
import { getRedisClient } from './redis.js';

export interface IdempotencyRecord {
  firstSeenAt: string;
  count: number;
}

export interface IdempotencyStats {
  activeKeys: number;
  maxCapacity: number;
  windowMs: number;
  totalDuplicatesCaught: number;
  redisConnected?: boolean;
}

export class IdempotencyEngine {
  private seenMessages = new Map<string, IdempotencyRecord>();
  private readonly windowMs: number;
  private readonly maxCapacity: number;
  private totalDuplicatesCaught = 0;

  constructor(windowMs: number = 10 * 60 * 1000, maxCapacity: number = 1000) {
    this.windowMs = windowMs;
    this.maxCapacity = maxCapacity;
  }

  /**
   * Cleans entries older than windowMs
   */
  private pruneExpired(): void {
    const now = Date.now();
    for (const [id, record] of this.seenMessages.entries()) {
      const entryTime = new Date(record.firstSeenAt).getTime();
      if (now - entryTime > this.windowMs) {
        this.seenMessages.delete(id);
      }
    }
  }

  /**
   * Distributed atomic check using Redis with local memory fallback
   */
  public async checkAndRecordDistributed(messageId: string): Promise<{
    isDuplicate: boolean;
    firstSeenAt?: string;
    duplicateCount: number;
    source: 'redis' | 'memory';
  }> {
    if (!messageId || messageId.trim().length === 0) {
      return { isDuplicate: false, duplicateCount: 0, source: 'memory' };
    }

    const trimmedId = messageId.trim();

    try {
      const redis = getRedisClient();
      const key = `janvaani:idemp:${trimmedId}`;
      const nowIso = new Date().toISOString();
      const ttlSec = Math.max(1, Math.ceil(this.windowMs / 1000));

      // SET key value EX ttlSec NX
      const acquired = await redis.set(key, nowIso, 'EX', ttlSec, 'NX');
      if (acquired === 'OK') {
        // Also record in memory for dual-layer safety
        this.checkAndRecord(trimmedId);
        return {
          isDuplicate: false,
          firstSeenAt: nowIso,
          duplicateCount: 1,
          source: 'redis',
        };
      }

      // Key already exists in Redis -> duplicate
      this.totalDuplicatesCaught += 1;
      const firstSeen = await redis.get(key);
      const incCount = await redis.incr(`${key}:count`);
      await redis.expire(`${key}:count`, ttlSec);

      return {
        isDuplicate: true,
        firstSeenAt: firstSeen || nowIso,
        duplicateCount: incCount + 1,
        source: 'redis',
      };
    } catch {
      // Fallback gracefully to memory store
      const mem = this.checkAndRecord(trimmedId);
      return {
        ...mem,
        source: 'memory',
      };
    }
  }

  /**
   * Check if a messageId has already been seen in the active window (synchronous local memory).
   */
  public checkAndRecord(messageId: string): {
    isDuplicate: boolean;
    firstSeenAt?: string;
    duplicateCount: number;
  } {
    if (!messageId || messageId.trim().length === 0) {
      return { isDuplicate: false, duplicateCount: 0 };
    }

    const trimmedId = messageId.trim();
    this.pruneExpired();

    const existing = this.seenMessages.get(trimmedId);
    if (existing) {
      existing.count += 1;
      this.totalDuplicatesCaught += 1;
      return {
        isDuplicate: true,
        firstSeenAt: existing.firstSeenAt,
        duplicateCount: existing.count,
      };
    }

    // Capacity bound: if max entries reached, evict oldest entry
    if (this.seenMessages.size >= this.maxCapacity) {
      const oldestKey = this.seenMessages.keys().next().value;
      if (oldestKey) {
        this.seenMessages.delete(oldestKey);
      }
    }

    const nowIso = new Date().toISOString();
    this.seenMessages.set(trimmedId, {
      firstSeenAt: nowIso,
      count: 1,
    });

    return {
      isDuplicate: false,
      firstSeenAt: nowIso,
      duplicateCount: 1,
    };
  }

  public getStats(): IdempotencyStats {
    this.pruneExpired();
    return {
      activeKeys: this.seenMessages.size,
      maxCapacity: this.maxCapacity,
      windowMs: this.windowMs,
      totalDuplicatesCaught: this.totalDuplicatesCaught,
    };
  }

  public clear(): void {
    this.seenMessages.clear();
    this.totalDuplicatesCaught = 0;
  }
}

export const idempotencyEngine = new IdempotencyEngine();
