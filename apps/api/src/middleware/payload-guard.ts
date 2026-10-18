import { Request, Response, NextFunction, Router } from 'express';

export interface PayloadRejectionEntry {
  timestamp: number;
  ip: string;
  path: string;
  contentLength: number;
  reason: string;
}

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_REJECTION_LOG_SIZE = 100;

// In-memory bounded rejection ring buffer
const rejectedPayloadLog: PayloadRejectionEntry[] = [];
let totalScannedRequests = 0;

export function getMaxBytesLimit(): number {
  if (process.env.PAYLOAD_GUARD_MAX_BYTES) {
    const custom = parseInt(process.env.PAYLOAD_GUARD_MAX_BYTES, 10);
    if (!Number.isNaN(custom) && custom > 0) {
      return custom;
    }
  }
  return DEFAULT_MAX_BYTES;
}

/**
 * Middleware that inspects incoming Content-Length to guard against memory exhaustion
 */
export function payloadGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  totalScannedRequests++;

  const rawLength = (req.headers['content-length'] || req.headers['x-content-length']) as string | undefined;
  if (rawLength !== undefined) {
    const contentLength = Number(rawLength);

    // Strict validation: Reject non-numeric, negative, or non-integer Content-Length
    if (Number.isNaN(contentLength) || contentLength < 0 || !Number.isInteger(contentLength)) {
      res.status(400).json({
        error: {
          code: 'INVALID_CONTENT_LENGTH',
          message: 'The Content-Length header must be a valid, non-negative integer.',
        },
      });
      return;
    }

    const currentMaxLimit = getMaxBytesLimit();

    if (contentLength > currentMaxLimit) {
      const entry: PayloadRejectionEntry = {
        timestamp: Date.now(),
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        path: req.path || req.url,
        contentLength,
        reason: 'CONTENT_LENGTH_EXCEEDED',
      };

      // Bounded buffer with FIFO eviction
      if (rejectedPayloadLog.length >= MAX_REJECTION_LOG_SIZE) {
        rejectedPayloadLog.shift();
      }
      rejectedPayloadLog.push(entry);

      res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Payload size of ${contentLength} bytes exceeds the maximum allowable limit of ${currentMaxLimit} bytes.`,
        },
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
      maxByteLimit: getMaxBytesLimit(),
      maxBufferSize: MAX_REJECTION_LOG_SIZE,
    },
  });
});

/**
 * POST /api/payload-guard/clear
 * Admin endpoint to clear rejected payloads buffer (Authenticated via environment key)
 */
payloadGuardRouter.post('/clear', (req: Request, res: Response) => {
  const secret = process.env.PAYLOAD_GUARD_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to clear payload guard rejection telemetry.',
      },
    });
    return;
  }

  rejectedPayloadLog.length = 0;
  res.status(200).json({
    status: 'ok',
    message: 'Payload guard rejection buffer cleared successfully',
  });
});
