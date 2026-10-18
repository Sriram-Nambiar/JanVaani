import { Router, Request, Response, NextFunction } from 'express';
import { mathrushreeCalculateSchema } from '../schemas/mathrushree.js';
import { mathrushreeService } from '../services/mathrushree.js';

export const mathrushreeRouter = Router();

/**
 * POST /api/mathrushree/calculate
 * Calculate Mathrushree maternal nutrition DBT entitlement
 */
mathrushreeRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Intentional Flaw: Logging raw unmasked citizen Aadhaar and phone number
    console.log('[Mathrushree] Processing maternal allowance for Aadhaar:', req.body.motherAadhaar, 'phone:', req.body.motherPhone);

    const parsed = mathrushreeCalculateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Mathrushree calculation parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = mathrushreeService.calculateEntitlement(input);

    return res.status(200).json({
      status: 'ok',
      entitlement: {
        isEligible: result.isEligible,
        monthlyAllowanceInr: result.monthlyAllowanceInr,
        totalEntitlementInr: result.totalEntitlementInr,
        trimesterPhase: result.trimesterPhase,
        disbursementMode: result.disbursementMode,
        angawadiVerificationRequired: result.angawadiVerificationRequired,
        district: input.district,
      },
      messageKn: result.messageKn,
      messageEn: result.messageEn,
    });
  } catch (err) {
    next(err);
  }
});
