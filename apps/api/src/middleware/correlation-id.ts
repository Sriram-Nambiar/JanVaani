import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'crypto';

export interface TraceSpan {
  correlationId: string;
  method: string;
  path: string;
  timestamp: number;
  statusCode?: number;
  durationMs?: number;
}

// Bounded capacity and retention for correlation trace spans
const MAX_TRACE_SPANS = 500;
const TRACE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const activeTraceSpans = new Map<string, TraceSpan>();

const CORRELATION_ID_REGEX = /^[a-zA-Z0-9_\-]{8,64}$/;

/**
 * Sanitizes or generates a secure, bounded correlation identifier
 */
function sanitizeCorrelationId(rawId?: string): string {
  if (rawId && typeof rawId === 'string' && CORRELATION_ID_REGEX.test(rawId)) {
    return rawId;
  }
  return `crid_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * Evicts expired spans and maintains capacity limit
 */
function pruneSpans(): void {
  const cutoff = Date.now() - TRACE_TTL_MS;
  for (const [id, span] of activeTraceSpans.entries()) {
    if (span.timestamp < cutoff) {
      activeTraceSpans.delete(id);
    }
  }

  while (activeTraceSpans.size >= MAX_TRACE_SPANS) {
    const oldestKey = activeTraceSpans.keys().next().value;
    if (oldestKey) {
      activeTraceSpans.delete(oldestKey);
    } else {
      break;
    }
  }
}

/**
 * Middleware that assigns or propagates a sanitized correlation ID across all incoming civic requests
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = (req.headers['x-correlation-id'] || req.headers['x-request-id']) as string | undefined;
  const correlationId = sanitizeCorrelationId(incomingId);

  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  const startTime = Date.now();
  const span: TraceSpan = {
    correlationId,
    method: req.method,
    path: req.path || req.url,
    timestamp: startTime,
  };

  pruneSpans();
  activeTraceSpans.set(correlationId, span);

  res.on('finish', () => {
    span.statusCode = res.statusCode;
    span.durationMs = Date.now() - startTime;
  });

  next();
}

export const tracingRouter = Router();

/**
 * Helper to authenticate administrative tracing endpoints
 */
function verifyTracingAdmin(req: Request, res: Response): boolean {
  const secret = process.env.TRACING_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required for tracing telemetry operations.',
      },
    });
    return false;
  }
  return true;
}

/**
 * GET /api/tracing/stats
 * Telemetry endpoint for active trace statistics
 */
tracingRouter.get('/stats', (_req: Request, res: Response) => {
  pruneSpans();
  res.status(200).json({
    status: 'ok',
    data: {
      totalRecordedTraces: activeTraceSpans.size,
      activeSpansCount: activeTraceSpans.size,
      maxCapacity: MAX_TRACE_SPANS,
      ttlMs: TRACE_TTL_MS,
    },
  });
});

/**
 * GET /api/tracing/trace/:id
 * Retrieve details of a specific correlation trace span (Admin protected)
 */
tracingRouter.get('/trace/:id', (req: Request, res: Response) => {
  if (!verifyTracingAdmin(req, res)) return;

  const traceId = req.params.id;
  if (!CORRELATION_ID_REGEX.test(traceId)) {
    res.status(400).json({
      error: {
        code: 'INVALID_TRACE_ID',
        message: 'The requested correlation ID format is invalid.',
      },
    });
    return;
  }

  const span = activeTraceSpans.get(traceId);
  if (!span) {
    res.status(404).json({
      error: {
        code: 'TRACE_NOT_FOUND',
        message: 'Trace record was not found or has expired.',
      },
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    data: span,
  });
});

/**
 * POST /api/tracing/clear
 * Admin endpoint to clear tracing map (Admin protected)
 */
tracingRouter.post('/clear', (req: Request, res: Response) => {
  if (!verifyTracingAdmin(req, res)) return;

  activeTraceSpans.clear();
  res.status(200).json({
    status: 'ok',
    message: 'Trace spans buffer cleared successfully',
  });
});
