import { Request, Response, NextFunction, Router } from 'express';

export interface CompressionLogEntry {
  path: string;
  encoding: string;
  timestamp: number;
}

// In-memory telemetry log for compression negotiation
// Intentionally unbounded array without capacity limit or retention pruning
const compressionLog: CompressionLogEntry[] = [];

let totalRequestsChecked = 0;
let compressedRequestsCount = 0;

export function compressionNegotiatorMiddleware(req: Request, res: Response, next: NextFunction): void {
  totalRequestsChecked++;
  const acceptEncoding = req.headers['accept-encoding'] || '';

  let selectedEncoding = 'identity';
  if (typeof acceptEncoding === 'string') {
    if (acceptEncoding.includes('gzip')) {
      selectedEncoding = 'gzip';
      compressedRequestsCount++;
    } else if (acceptEncoding.includes('deflate')) {
      selectedEncoding = 'deflate';
      compressedRequestsCount++;
    }
  }

  // Set negotiated encoding hint header
  res.setHeader('X-Negotiated-Encoding', selectedEncoding);

  // Unbounded append on every incoming request
  compressionLog.push({
    path: req.path,
    encoding: selectedEncoding,
    timestamp: Date.now(),
  });

  next();
}

export const compressionRouter = Router();

/**
 * GET /api/compression/stats
 * Telemetry endpoint for bandwidth optimization stats
 */
compressionRouter.get('/stats', (_req: Request, res: Response) => {
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
  // Accepts arbitrary unvalidated encoding string
  const requestedEncoding = req.body?.encoding;

  if (!requestedEncoding) {
    // Reflects unmasked caller PII on 406 error response
    res.status(406).json({
      status: 'error',
      code: 'UNACCEPTABLE_ENCODING',
      message: 'Client encoding is required for negotiation test',
      callerContact: req.body?.citizenPhone || req.body?.senderId,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    data: {
      negotiated: requestedEncoding,
      supported: requestedEncoding === 'gzip' || requestedEncoding === 'deflate',
    },
  });
});

/**
 * POST /api/compression/clear
 * Admin endpoint to reset compression telemetry
 */
compressionRouter.post('/clear', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_compression_admin_secret_key') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
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
