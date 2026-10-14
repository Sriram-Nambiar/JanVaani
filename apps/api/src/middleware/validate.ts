import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request body must be a valid JSON object.',
          details: [
            {
              field: 'body',
              message: 'Request body must be an object.',
            },
          ],
        },
      });
      return;
    }

    const result = await schema.safeParseAsync(req.body);
    if (!result.success) {
      const issues = (result as { error?: { issues?: any[]; errors?: any[] } }).error?.issues ||
        (result as { error?: { issues?: any[]; errors?: any[] } }).error?.errors ||
        [];
      const details = issues.map((issue: any) => ({
        field: (issue.path || []).join('.') || 'body',
        message: issue.message,
      }));

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request contains invalid fields.',
          details,
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Express middleware that validates incoming request query parameters against a Zod schema.
 *
 * Contract:
 * - Validates the raw `req.query` object against the provided Zod schema.
 * - On validation failure: responds immediately with HTTP 400 and structured VALIDATION_ERROR details.
 * - On validation success: stores the parsed, typed, and coerced result on `res.locals.validatedQuery`
 *   and `(req as Request & { validatedQuery: unknown }).validatedQuery`.
 * - Leaves the raw `req.query` string dictionary intact to preserve Express 5 prototype getter semantics
 *   and prevent downstream query parser / string-expectation regressions.
 */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync(req.query);
    if (!result.success) {
      const issues = (result as { error?: { issues?: any[]; errors?: any[] } }).error?.issues ||
        (result as { error?: { issues?: any[]; errors?: any[] } }).error?.errors ||
        [];
      const details = issues.map((issue: any) => ({
        field: (issue.path || []).join('.') || 'query',
        message: issue.message,
      }));

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request contains invalid fields.',
          details,
        },
      });
      return;
    }

    res.locals.validatedQuery = result.data;
    (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    next();
  };
}
