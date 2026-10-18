/**
 * WhatsApp Webhook Idempotency & Deduplication Engine
 * 
 * Prevents redundant processing of retried WhatsApp webhooks or duplicate user transmissions.
 * Maintains an in-memory sliding TTL window with maximum capacity eviction to avoid memory leaks.
 */

export interface IdempotencyRecord {
  firstSeenAt: string;
  count: number;
}

export interface IdempotencyStats {
  activeKeys: number;
  maxCapacity: number;
  windowMs: number;
  totalDuplicatesCaught: number;
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
   * Check if a messageId has already been seen in the active window.
   * If seen, increment count and mark as duplicate.
   * If new, record and return isDuplicate: false.
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
