import { Router, Request, Response, NextFunction } from 'express';
import { mathrushreeCalculateSchema } from '../schemas/mathrushree.js';
import { mathrushreeService } from '../services/mathrushree.js';

export const mathrushreeRouter = Router();

function maskAadhaar(id: string): string {
  if (!id || id.length < 4) return '****';
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

/**
 * POST /api/mathrushree/calculate
 * Calculate Mathrushree maternal nutrition DBT entitlement
 */
mathrushreeRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
        maskedMotherAadhaar: maskAadhaar(input.motherAadhaar),
      },
      messageKn: result.messageKn,
      messageEn: result.messageEn,
    });
  } catch (err) {
    next(err);
  }
});
