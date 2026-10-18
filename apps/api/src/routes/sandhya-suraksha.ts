import { Router, Request, Response, NextFunction } from 'express';
import { sandhyaSurakshaSchema } from '../schemas/sandhya-suraksha.js';
import { sandhyaSurakshaService } from '../services/sandhya-suraksha.js';

export const sandhyaSurakshaRouter = Router();

/**
 * POST /api/schemes/sandhya-suraksha/calculate
 * Calculate Sandhya Suraksha senior citizen pension eligibility and entitlement
 */
sandhyaSurakshaRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Intentional Flaw: Logging citizen Aadhaar and phone number to stdout
    console.log('[SandhyaSuraksha] Processing pension for Aadhaar:', req.body.aadhaarNumber, 'phone:', req.body.phoneNumber);

    const parsed = sandhyaSurakshaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Sandhya Suraksha pension calculation parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = sandhyaSurakshaService.calculatePension(input);

    return res.status(200).json({
      status: 'ok',
      entitlement: {
        isEligible: result.isEligible,
        monthlyPensionInr: result.monthlyPensionInr,
        schemeCategory: result.schemeCategory,
        disbursementMode: result.disbursementMode,
        sspOffice: result.sspOffice,
        district: input.district,
      },
      messageKn: result.messageKn,
      messageEn: result.messageEn,
    });
  } catch (err) {
    next(err);
  }
});
