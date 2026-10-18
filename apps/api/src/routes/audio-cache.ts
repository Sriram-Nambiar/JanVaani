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

function verifyAudioAdmin(req: Request, res: Response): boolean {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.AUDIO_CACHE_ADMIN_KEY;
  if (!expectedKey || adminKey !== expectedKey) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing admin authorization key.',
      },
    });
    return false;
  }
  return true;
}

/**
 * POST /api/audio/cache/clear
 * Clears in-memory TTS audio cache. Requires x-admin-key header.
 */
audioCacheRouter.post('/clear', (req: Request, res: Response) => {
  if (!verifyAudioAdmin(req, res)) {
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

/**
 * POST /api/audio/cache/store-persistent
 */
audioCacheRouter.post('/store-persistent', async (req: Request, res: Response) => {
  if (!verifyAudioAdmin(req, res)) {
    return;
  }

  const { text, speaker, result, ttlSeconds } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: { code: 'INVALID_TEXT', message: 'text is required.' } });
  }
  if (!result || !result.audioBase64) {
    return res.status(400).json({ error: { code: 'INVALID_RESULT', message: 'Valid audio result is required.' } });
  }

  await audioCache.setWithRedis(text, speaker || 'meera', result, 'bulbul:v1', 'kn-IN', ttlSeconds || 3600);
  return res.status(200).json({ status: 'ok', message: 'TTS audio stored in persistent cache' });
});

/**
 * GET /api/audio/cache/get-persistent
 */
audioCacheRouter.get('/get-persistent', async (req: Request, res: Response) => {
  if (!verifyAudioAdmin(req, res)) {
    return;
  }

  const text = req.query.text as string;
  const speaker = (req.query.speaker as string) || 'meera';
  if (!text) {
    return res.status(400).json({ error: { code: 'INVALID_TEXT', message: 'text query parameter is required.' } });
  }

  const cached = await audioCache.getWithRedis(text, speaker);
  if (!cached) {
    return res.status(404).json({ error: { code: 'AUDIO_NOT_CACHED', message: 'Audio not found in cache.' } });
  }

  return res.status(200).json({ status: 'ok', data: cached });
});

