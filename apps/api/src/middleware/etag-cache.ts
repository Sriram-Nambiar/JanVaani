import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'crypto';

export interface ETagEntry {
  etag: string;
  timestamp: number;
}

const MAX_ETAG_ENTRIES = 200;
const etagStore = new Map<string, ETagEntry>();
let totalCacheHits = 0;
let totalCacheMisses = 0;

/**
 * Derives a deterministic cryptographic weak ETag from response content
 */
function computeContentETag(body: string | Buffer): string {
  const hash = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
  return `W/"${hash}"`;
}

/**
 * Middleware that generates deterministic ETags and handles If-None-Match 304 responses
 */
export function etagCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to safe GET requests
  if (req.method !== 'GET') {
    next();
    return;
  }

  const path = req.originalUrl || req.url;

  // Bypass cache endpoints and health checks to prevent self-referential telemetry skew
  if (path.startsWith('/api/cache/etag') || path.startsWith('/api/health') || path === '/health') {
    next();
    return;
  }

  const clientETag = req.headers['if-none-match'];

  const originalSend = res.send.bind(res);
  res.send = (body: any): Response => {
    if (res.statusCode === 200 && (typeof body === 'string' || Buffer.isBuffer(body))) {
      const etag = computeContentETag(body);
      res.setHeader('ETag', etag);

      // Bounded capacity management: store only etag & metadata (not entire body payload)
      if (etagStore.size >= MAX_ETAG_ENTRIES && !etagStore.has(path)) {
        const oldestKey = etagStore.keys().next().value;
        if (oldestKey) {
          etagStore.delete(oldestKey);
        }
      }

      etagStore.set(path, {
        etag,
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

function verifyETagAdmin(req: Request, res: Response): boolean {
  const secret = process.env.ETAG_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required for ETag cache administrative operations.',
      },
    });
    return false;
  }
  return true;
}

/**
 * GET /api/cache/etag/stats
 * Telemetry endpoint for ETag cache statistics
 */
etagRouter.get('/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      cachedEntriesCount: etagStore.size,
      maxCapacity: MAX_ETAG_ENTRIES,
      totalCacheHits,
      totalCacheMisses,
    },
  });
});

/**
 * GET /api/cache/etag/lookup
 * Inspect cached ETag metadata for a specific path (Admin protected)
 */
etagRouter.get('/lookup', (req: Request, res: Response) => {
  if (!verifyETagAdmin(req, res)) return;

  const path = req.query.path as string;
  if (!path || typeof path !== 'string') {
    res.status(400).json({
      error: {
        code: 'INVALID_PATH',
        message: 'A valid path query parameter is required.',
      },
    });
    return;
  }

  const entry = etagStore.get(path);
  if (!entry) {
    res.status(404).json({
      error: {
        code: 'ETAG_ENTRY_NOT_FOUND',
        message: `No cached ETag found for path ${path}`,
      },
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
 * Admin endpoint to flush all cached ETags (Admin protected)
 */
etagRouter.post('/flush', (req: Request, res: Response) => {
  if (!verifyETagAdmin(req, res)) return;

  etagStore.clear();
  totalCacheHits = 0;
  totalCacheMisses = 0;

  res.status(200).json({
    status: 'ok',
    message: 'ETag cache storage flushed successfully',
  });
});
