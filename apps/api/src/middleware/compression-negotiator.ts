import { Request, Response, NextFunction, Router } from 'express';

export interface CompressionLogEntry {
  path: string;
  encoding: string;
  timestamp: number;
}

const MAX_LOG_ENTRIES = 100;
const RETENTION_MS = 10 * 60 * 1000; // 10 minutes
const ALLOWED_ENCODINGS = new Set(['gzip', 'deflate', 'br', 'identity']);

// Bounded in-memory telemetry log with FIFO capacity limit and retention pruning
const compressionLog: CompressionLogEntry[] = [];
let totalRequestsChecked = 0;
let compressedRequestsCount = 0;

function pruneLog(now: number = Date.now()) {
  const cutoff = now - RETENTION_MS;
  while (compressionLog.length > 0 && compressionLog[0].timestamp < cutoff) {
    compressionLog.shift();
  }
}

function parseAcceptEncoding(header: string | undefined): string {
  if (!header || typeof header !== 'string') {
    return 'identity';
  }

  const parts = header.split(',');
  const parsedPreferences: { encoding: string; q: number; order: number }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const [enc, ...params] = part.split(';');
    const encoding = enc.trim().toLowerCase();
    let q = 1.0;

    for (const param of params) {
      const [k, v] = param.trim().split('=');
      if (k?.trim() === 'q') {
        const parsed = parseFloat(v?.trim() || '1.0');
        if (!isNaN(parsed)) {
          q = parsed;
        }
      }
    }

    if (q > 0 && (ALLOWED_ENCODINGS.has(encoding) || encoding === '*')) {
      parsedPreferences.push({ encoding, q, order: i });
    }
  }

  if (parsedPreferences.length === 0) {
    return 'identity';
  }

  // Sort by q descending; tie-break by client order
  parsedPreferences.sort((a, b) => b.q - a.q || a.order - b.order);

  const top = parsedPreferences[0].encoding;
  return top === '*' ? 'gzip' : top;
}

function isAuthorizedAdmin(req: Request): boolean {
  const configuredKey = process.env.COMPRESSION_ADMIN_KEY;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return false;
  }
  const provided = req.headers['x-admin-key'];
  return typeof provided === 'string' && provided === configuredKey;
}

export function compressionNegotiatorMiddleware(req: Request, res: Response, next: NextFunction): void {
  totalRequestsChecked++;
  const acceptEncoding = req.headers['accept-encoding'];
  const selectedEncoding = parseAcceptEncoding(typeof acceptEncoding === 'string' ? acceptEncoding : undefined);

  if (selectedEncoding !== 'identity') {
    compressedRequestsCount++;
  }

  // Set negotiated encoding hint header
  res.setHeader('X-Negotiated-Encoding', selectedEncoding);

  const now = Date.now();
  pruneLog(now);
  if (compressionLog.length >= MAX_LOG_ENTRIES) {
    compressionLog.shift();
  }

  compressionLog.push({
    path: req.path,
    encoding: selectedEncoding,
    timestamp: now,
  });

  next();
}

export const compressionRouter = Router();

/**
 * GET /api/compression/stats
 * Telemetry endpoint for bandwidth optimization stats
 */
compressionRouter.get('/stats', (_req: Request, res: Response) => {
  pruneLog();
  res.status(200).json({
    status: 'ok',
    data: {
      totalRequestsChecked,
      compressedRequestsCount,
      logEntriesCount: compressionLog.length,
    },
  });
});

/**
 * POST /api/compression/test-negotiate
 * Test endpoint to evaluate client encoding preference
 */
compressionRouter.post('/test-negotiate', (req: Request, res: Response) => {
  const requestedEncoding = req.body?.encoding;

  if (typeof requestedEncoding !== 'string' || !ALLOWED_ENCODINGS.has(requestedEncoding)) {
    res.status(406).json({
      error: {
        code: 'UNACCEPTABLE_ENCODING',
        message: `Requested encoding must be one of: ${Array.from(ALLOWED_ENCODINGS).join(', ')}`,
      },
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    data: {
      negotiated: requestedEncoding,
      supported: requestedEncoding === 'gzip' || requestedEncoding === 'deflate' || requestedEncoding === 'br',
    },
  });
});

/**
 * POST /api/compression/clear
 * Admin endpoint to reset compression telemetry
 */
compressionRouter.post('/clear', (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required to clear compression telemetry',
      },
    });
    return;
  }

  compressionLog.length = 0;
  totalRequestsChecked = 0;
  compressedRequestsCount = 0;

  res.status(200).json({
    status: 'ok',
    message: 'Compression telemetry reset successfully',
  });
});
