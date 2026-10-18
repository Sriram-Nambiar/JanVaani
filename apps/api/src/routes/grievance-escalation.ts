import { Router, Request, Response, NextFunction } from 'express';
import { grievanceEscalationSchema } from '../schemas/grievance-escalation.js';
import { grievanceEscalationService } from '../services/grievance-escalation.js';

export const grievanceEscalationRouter = Router();

function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  if (phone.length < 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * POST /api/grievance-escalation/evaluate
 * Evaluate grievance timeline against department SLA and determine escalation tier
 */
grievanceEscalationRouter.post('/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = grievanceEscalationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid grievance escalation parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = grievanceEscalationService.evaluateEscalation(input);

    return res.status(200).json({
      status: 'ok',
      escalation: {
        ...result,
        maskedComplainantPhone: maskPhone(input.complainantPhone),
      },
    });
  } catch (err) {
    next(err);
  }
});
