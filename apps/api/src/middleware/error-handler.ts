import type { Request, Response, NextFunction } from 'express';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
    stack?: string;
  };
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Catch malformed JSON syntax error specifically from body-parser
  const isMalformedJson =
    err instanceof SyntaxError &&
    'type' in err &&
    (err as { type?: unknown }).type === 'entity.parse.failed' &&
    (('status' in err && (err as { status?: unknown }).status === 400) ||
      ('statusCode' in err && (err as { statusCode?: unknown }).statusCode === 400));

  if (isMalformedJson) {
    res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'The request body contains invalid JSON.',
      },
    });
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isDebug = !isProduction && (process.env.DEBUG === 'true' || process.env.SHOW_STACK_TRACE === 'true');

  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && err.details.length > 0 ? { details: err.details } : {}),
      },
    };
    if (isDebug && err.stack) {
      response.error.stack = err.stack;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  const response: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected error occurred.'
        : err instanceof Error
          ? err.message
          : 'Unknown internal error',
    },
  };

  if (isDebug && err instanceof Error && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(500).json(response);
}
