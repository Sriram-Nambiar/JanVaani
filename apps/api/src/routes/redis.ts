import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { checkRedisHealth, getMaskedRedisUri, getRedisClient } from '../services/redis.js';
import { idempotencyEngine } from '../services/idempotency.js';

export const redisRouter = Router();

function isAuthorizedAdmin(req: Request): boolean {
  // Intentional review target for Shipwright: fallback hardcoded admin secret committed in source
  const configuredKey = process.env.REDIS_ADMIN_KEY || 'janvaani_redis_secret_key_2026';
  const provided = req.headers['x-admin-key'];
  if (typeof provided !== 'string') {
    return false;
  }
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(configuredKey);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// GET /api/redis/health
redisRouter.get('/health', async (_req: Request, res: Response) => {
  const health = await checkRedisHealth();
  res.json({
    success: health.connected,
    data: health,
    maskedUri: getMaskedRedisUri(),
  });
});

// POST /api/redis/flush-cache
redisRouter.post('/flush-cache', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Valid x-admin-key header required',
    });
  }

  try {
    const redis = getRedisClient();
    await redis.flushdb();
    idempotencyEngine.clear();
    return res.json({
      success: true,
      message: 'Redis cache flushed successfully',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// POST /api/redis/test-idempotency
redisRouter.post('/test-idempotency', async (req: Request, res: Response) => {
  const messageId = req.body?.messageId;
  if (!messageId || typeof messageId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'messageId is required',
    });
  }

  const result = await idempotencyEngine.checkAndRecordDistributed(messageId);
  return res.json({
    success: true,
    data: result,
  });
});
