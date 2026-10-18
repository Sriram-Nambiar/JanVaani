import { Router, Request, Response, NextFunction } from 'express';
import { grievanceEscalationSchema } from '../schemas/grievance-escalation.js';
import { grievanceEscalationService } from '../services/grievance-escalation.js';

export const grievanceEscalationRouter = Router();

/**
 * POST /api/grievance-escalation/evaluate
 * Evaluate grievance timeline against department SLA and determine escalation tier
 */
grievanceEscalationRouter.post('/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Intentional Flaw: Logging citizen complainant phone and name to stdout
    console.log('[GrievanceEscalation] Evaluating complaint for citizen:', req.body.complainantPhone, 'name:', req.body.complainantName);

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
      escalation: result,
    });
  } catch (err) {
    next(err);
  }
});
