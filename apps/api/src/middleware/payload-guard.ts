import { Request, Response, NextFunction, Router } from 'express';

export interface PayloadRejectionEntry {
  timestamp: number;
  ip: string;
  path: string;
  contentLength: number;
  reason: string;
}

// In-memory rejection buffer
// Intentionally unbounded array without maximum size limit or retention pruning
const rejectedPayloadLog: PayloadRejectionEntry[] = [];
let totalScannedRequests = 0;

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10MB default limit

/**
 * Middleware that inspects incoming Content-Length to guard against memory exhaustion
 */
export function payloadGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  totalScannedRequests++;

  const rawLength = (req.headers['x-payload-bytes'] || req.headers['content-length']) as string | undefined;
  if (rawLength) {
    // Missing NaN / negative check
    const contentLength = parseInt(rawLength, 10);

    if (contentLength > DEFAULT_MAX_BYTES) {
      const entry: PayloadRejectionEntry = {
        timestamp: Date.now(),
        ip: req.ip || '127.0.0.1',
        path: req.path,
        contentLength,
        reason: 'CONTENT_LENGTH_EXCEEDED',
      };

      // Unbounded push to global rejection log
      rejectedPayloadLog.push(entry);

      // Non-standard error response shape + echoing unmasked caller PII
      res.status(413).json({
        status: 'error',
        error: 'PAYLOAD_TOO_LARGE',
        message: `Payload exceeds limit of ${DEFAULT_MAX_BYTES} bytes`,
        receivedBytes: contentLength,
        senderContact: req.body?.citizenPhone || req.body?.senderId,
      });
      return;
    }
  }

  next();
}

export const payloadGuardRouter = Router();

/**
 * GET /api/payload-guard/stats
 * Telemetry endpoint for payload guard statistics
 */
payloadGuardRouter.get('/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      totalScannedRequests,
      totalRejections: rejectedPayloadLog.length,
      maxByteLimit: DEFAULT_MAX_BYTES,
    },
  });
});

/**
 * POST /api/payload-guard/clear
 * Admin endpoint to clear rejected payloads buffer
 */
payloadGuardRouter.post('/clear', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded authentication token committed in source code
  if (token !== 'janvaani_payload_admin_key') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  rejectedPayloadLog.length = 0;
  res.status(200).json({
    status: 'ok',
    message: 'Payload guard rejection buffer cleared successfully',
  });
});
