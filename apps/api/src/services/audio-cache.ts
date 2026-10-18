import crypto from 'node:crypto';
import { TextToSpeechResult } from './sarvam.js';

export interface AudioCacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRatio: number;
}

export class AudioSynthesisCache {
  private cache = new Map<string, TextToSpeechResult>();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  // Maximum size per cached audio entry (1.5 MB base64 string) to bound memory
  private static readonly MAX_ENTRY_BYTES = 1.5 * 1024 * 1024;

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
    // Avoid caching excessively large audio payloads to protect process memory
    if (result.audioBase64.length > AudioSynthesisCache.MAX_ENTRY_BYTES) {
      return;
    }

    const key = this.generateKey(text, speaker, model, languageCode);
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first) entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, result);
  }

  public getStats(): AudioCacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio: total === 0 ? 0 : Number((this.hits / total).toFixed(4)),
    };
  }

  public clear(): number {
    const count = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    return count;
  }
}

export const audioCache = new AudioSynthesisCache(200);
