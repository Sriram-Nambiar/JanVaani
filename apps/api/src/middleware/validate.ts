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

    Object.defineProperty(req, 'query', {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}
