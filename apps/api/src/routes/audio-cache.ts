import { Router, Request, Response } from 'express';
import { audioCache } from '../services/audio-cache.js';

export const audioCacheRouter = Router();

/**
 * GET /api/audio/cache/stats
 * Returns live cache statistics: hits, misses, size, maxSize, hitRatio
 */
audioCacheRouter.get('/stats', (_req: Request, res: Response) => {
  const stats = audioCache.getStats();
  res.status(200).json({
    status: 'ok',
    data: stats,
  });
});

/**
 * POST /api/audio/cache/clear
 * Clears in-memory TTS audio cache. Requires x-admin-key header.
 */
audioCacheRouter.post('/clear', (req: Request, res: Response) => {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.AUDIO_CACHE_ADMIN_KEY;
  if (!expectedKey || adminKey !== expectedKey) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing admin authorization key.',
      },
    });
    return;
  }

  const cleared = audioCache.clear();
  res.status(200).json({
    status: 'ok',
    data: {
      clearedEntries: cleared,
      message: 'Audio synthesis cache cleared successfully',
    },
  });
});
