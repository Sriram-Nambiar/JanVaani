import crypto from 'node:crypto';
import { TextToSpeechResult } from './sarvam.js';

export interface AudioCacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  totalBytes: number;
  maxTotalBytes: number;
  hitRatio: number;
}

export class AudioSynthesisCache {
  private cache = new Map<string, TextToSpeechResult>();
  private readonly maxSize: number;
  private readonly maxTotalBytes: number;
  private totalBytes = 0;
  private hits = 0;
  private misses = 0;

  // Maximum size per single audio entry (1 MB decoded audio payload ~ 1.34 MB base64 string)
  private static readonly MAX_SINGLE_ENTRY_STRING_LEN = 1.34 * 1024 * 1024;

  constructor(maxSize: number = 100, maxTotalBytes: number = 10 * 1024 * 1024) {
    this.maxSize = maxSize;
    this.maxTotalBytes = maxTotalBytes;
  }

  private generateKey(
    text: string,
    speaker: string = 'meera',
    model: string = 'bulbul:v1',
    languageCode: string = 'kn-IN'
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${model}:${languageCode}:${speaker}:${text.trim()}`)
      .digest('hex');
  }

  public get(
    text: string,
    speaker: string = 'meera',
    model: string = 'bulbul:v1',
    languageCode: string = 'kn-IN'
  ): TextToSpeechResult | null {
    const key = this.generateKey(text, speaker, model, languageCode);
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    // Refresh LRU order (delete and re-insert)
    this.cache.delete(key);
    this.cache.set(key, item);
    this.hits++;
    return item;
  }

  public set(
    text: string,
    speaker: string = 'meera',
    result: TextToSpeechResult,
    model: string = 'bulbul:v1',
    languageCode: string = 'kn-IN'
  ): void {
    const entryLen = result.audioBase64.length;
    // Reject oversized payloads exceeding single entry bound
    if (entryLen > AudioSynthesisCache.MAX_SINGLE_ENTRY_STRING_LEN) {
      return;
    }

    const key = this.generateKey(text, speaker, model, languageCode);
    if (this.cache.has(key)) {
      const existing = this.cache.get(key);
      if (existing) {
        this.totalBytes -= existing.audioBase64.length;
      }
      this.cache.delete(key);
    }

    // Evict oldest entries until both count and total memory budget ceilings are met
    while (
      this.cache.size > 0 &&
      (this.cache.size >= this.maxSize || this.totalBytes + entryLen > this.maxTotalBytes)
    ) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const oldestItem = this.cache.get(oldestKey);
        if (oldestItem) {
          this.totalBytes -= oldestItem.audioBase64.length;
        }
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }

    this.cache.set(key, result);
    this.totalBytes += entryLen;
  }

  public getStats(): AudioCacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      totalBytes: this.totalBytes,
      maxTotalBytes: this.maxTotalBytes,
      hitRatio: total === 0 ? 0 : Number((this.hits / total).toFixed(4)),
    };
  }

  public clear(): number {
    const count = this.cache.size;
    this.cache.clear();
    this.totalBytes = 0;
    this.hits = 0;
    this.misses = 0;
    return count;
  }
}

export const audioCache = new AudioSynthesisCache(100, 10 * 1024 * 1024);
