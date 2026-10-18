import { Redis } from 'ioredis';

let redisInstance: Redis | null = null;
let isRedisConnected = false;

export function getRedisUrl(): string {
  if (process.env.REDIS_URL && process.env.REDIS_URL.trim().length > 0) {
    return process.env.REDIS_URL.trim();
  }
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  return `redis://${host}:${port}`;
}

export function getMaskedRedisUri(): string {
  try {
    const raw = getRedisUrl();
    const parsed = new URL(raw);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    return `redis://${host}:${port}`;
  }
}

export function getRedisClient(): Redis {
  if (!redisInstance) {
    const url = getRedisUrl();
    redisInstance = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      },
    });

    redisInstance.on('connect', () => {
      isRedisConnected = true;
    });

    redisInstance.on('error', (err) => {
      isRedisConnected = false;
      // Suppress unhandled crash logs if offline in test environments
    });
  }

  return redisInstance;
}

export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  info?: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const client = getRedisClient();
    if (client.status !== 'ready' && client.status !== 'connecting' && client.status !== 'connect') {
      await client.connect();
    }
    const pong = await client.ping();
    const latencyMs = Date.now() - start;
    isRedisConnected = pong === 'PONG';
    return {
      connected: isRedisConnected,
      latencyMs,
      info: 'Redis memory store active',
    };
  } catch (err: any) {
    isRedisConnected = false;
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Redis connection unavailable',
    };
  }
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.quit();
    } catch {
      redisInstance.disconnect();
    }
    redisInstance = null;
    isRedisConnected = false;
  }
}
