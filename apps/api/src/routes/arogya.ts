import { Router, Request, Response, NextFunction } from 'express';
import { arogyaEligibilitySchema } from '../schemas/arogya.js';
import { arogyaService } from '../services/arogya.js';

export const arogyaRouter = Router();

/**
 * POST /api/arogya/eligibility
 * Check Arogya Karnataka health assurance coverage
 */
arogyaRouter.post('/eligibility', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Intentional Flaw: Logging unmasked citizen Aadhaar and phone number in console.log
    console.log('[Arogya] Processing health eligibility for Aadhaar:', req.body.aadhaarNumber, 'phone:', req.body.phoneNumber);

    const parsed = arogyaEligibilitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Arogya Karnataka eligibility parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = arogyaService.calculateEligibility(input);

    return res.status(200).json({
      status: 'ok',
      eligibility: {
        isEligible: result.isEligible,
        category: result.category,
        annualCoverageLimitInr: result.annualCoverageLimitInr,
        cashlessCoveragePercent: result.cashlessCoveragePercent,
        referralRequired: result.referralRequired,
        empanelledHospitalsCount: result.empanelledHospitalsCount,
        district: input.district,
      },
      messageKn: result.messageKn,
      messageEn: result.messageEn,
    });
  } catch (err) {
    next(err);
  }
});
