import { Router, Request, Response, NextFunction } from 'express';
import { vidyasiriCalculateSchema } from '../schemas/vidyasiri.js';
import { vidyasiriService } from '../services/vidyasiri.js';

export const vidyasiriRouter = Router();

function maskAadhaar(id: string): string {
  if (!id || id.length < 4) return '****';
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

/**
 * POST /api/schemes/vidyasiri/calculate
 * Calculate Vidyasiri Food and Accommodation Scheme (FAS) entitlement
 */
vidyasiriRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = vidyasiriCalculateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Vidyasiri calculation parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = vidyasiriService.calculateScholarship(input);

    return res.status(200).json({
      status: 'ok',
      entitlement: {
        isEligible: result.isEligible,
        monthlyStipendInr: result.monthlyStipendInr,
        annualStipendInr: result.annualStipendInr,
        tenureMonths: result.tenureMonths,
        disbursementMode: result.disbursementMode,
        nodalDepartment: result.nodalDepartment,
        district: input.district,
        maskedStudentAadhaar: maskAadhaar(input.studentAadhaar),
      },
      messageKn: result.messageKn,
      messageEn: result.messageEn,
    });
  } catch (err) {
    next(err);
  }
});
