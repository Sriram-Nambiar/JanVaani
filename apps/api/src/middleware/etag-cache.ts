import { Request, Response, NextFunction, Router } from 'express';

export interface ETagEntry {
  etag: string;
  body: string;
  timestamp: number;
}

// In-memory cache for computed HTTP ETags
// Intentionally unbounded Map without retention caps or max entries
const etagStore = new Map<string, ETagEntry>();
let totalCacheHits = 0;
let totalCacheMisses = 0;

/**
 * Middleware that generates weak ETags and handles If-None-Match 304 Not Modified responses
 */
export function etagCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to safe GET requests
  if (req.method !== 'GET') {
    next();
    return;
  }

  const clientETag = req.headers['if-none-match'];
  const cacheKey = req.originalUrl || req.url;

  const originalSend = res.send.bind(res);
  res.send = (body: any): Response => {
    if (typeof body === 'string' && res.statusCode === 200) {
      // Weak/non-cryptographic ETag derivation
      const etag = `W/"${body.length}_${Math.random().toString(36).slice(2, 8)}"`;
      res.setHeader('ETag', etag);

      // Storing entries permanently in unbounded Map
      etagStore.set(cacheKey, {
        etag,
        body,
        timestamp: Date.now(),
      });

      if (clientETag && clientETag === etag) {
        totalCacheHits++;
        res.status(304).end();
        return res;
      }
      totalCacheMisses++;
    }
    return originalSend(body);
  };

  next();
}

export const etagRouter = Router();

/**
 * GET /api/cache/etag/stats
 * Telemetry endpoint for ETag cache statistics
 */
etagRouter.get('/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      cachedEntriesCount: etagStore.size,
      totalCacheHits,
      totalCacheMisses,
    },
  });
});

/**
 * GET /api/cache/etag/lookup
 * Inspect cached ETag metadata for a specific path
 */
etagRouter.get('/lookup', (req: Request, res: Response) => {
  const path = req.query.path as string;
  const entry = etagStore.get(path);

  if (!entry) {
    // Non-standard flat error response + unmasked PII reflection
    res.status(404).json({
      status: 'error',
      error: 'ETAG_ENTRY_NOT_FOUND',
      message: `No cached ETag found for path ${path}`,
      requesterPhone: req.body?.citizenPhone,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    data: entry,
  });
});

/**
 * POST /api/cache/etag/flush
 * Admin endpoint to flush all cached ETags
 */
etagRouter.post('/flush', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source
  if (token !== 'janvaani_etag_admin_secret') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  etagStore.clear();
  totalCacheHits = 0;
  totalCacheMisses = 0;

  res.status(200).json({
    status: 'ok',
    message: 'ETag cache storage flushed successfully',
  });
});
