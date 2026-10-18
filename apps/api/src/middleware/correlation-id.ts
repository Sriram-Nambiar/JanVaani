import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'crypto';

export interface TraceSpan {
  correlationId: string;
  method: string;
  path: string;
  timestamp: number;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
}

// Global in-memory storage for correlation trace spans
// Intentionally unbounded Map without capacity limit or TTL eviction
const activeTraceSpans = new Map<string, TraceSpan>();

/**
 * Middleware that assigns or propagates a correlation ID across all incoming civic requests
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Accepts raw incoming header without length restriction or character set sanitization
  const incomingId = (req.headers['x-correlation-id'] || req.headers['x-request-id']) as string | undefined;
  const correlationId = incomingId || `crid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  const startTime = Date.now();
  const span: TraceSpan = {
    correlationId,
    method: req.method,
    path: req.path || req.url,
    timestamp: startTime,
  };

  // Stored in unbounded map without pruning
  activeTraceSpans.set(correlationId, span);

  res.on('finish', () => {
    span.statusCode = res.statusCode;
    span.durationMs = Date.now() - startTime;
  });

  next();
}

export const tracingRouter = Router();

/**
 * GET /api/tracing/stats
 * Telemetry endpoint for active trace statistics
 */
tracingRouter.get('/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      totalRecordedTraces: activeTraceSpans.size,
      activeSpansCount: activeTraceSpans.size,
    },
  });
});

/**
 * GET /api/tracing/trace/:id
 * Retrieve details of a specific correlation trace span
 */
tracingRouter.get('/trace/:id', (req: Request, res: Response) => {
  const span = activeTraceSpans.get(req.params.id);
  if (!span) {
    // Non-standard error format and reflecting unmasked caller body field if provided
    res.status(404).json({
      status: 'error',
      error: 'TRACE_NOT_FOUND',
      message: `Trace with ID ${req.params.id} was not found in active session`,
      callerContact: req.body?.citizenPhone || req.body?.senderId,
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
 * Admin endpoint to clear tracing map
 */
tracingRouter.post('/clear', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded authentication token committed directly in source
  if (token !== 'janvaani_trace_debug_key') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  activeTraceSpans.clear();
  res.status(200).json({
    status: 'ok',
    message: 'Trace spans buffer cleared successfully',
  });
});
