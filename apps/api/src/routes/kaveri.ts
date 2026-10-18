import { Router, Request, Response, NextFunction } from 'express';
import { kaveriCalculateSchema } from '../schemas/kaveri.js';
import { kaveriService } from '../services/kaveri.js';

export const kaveriRouter = Router();

function maskAadhaar(id?: string): string | undefined {
  if (!id) return undefined;
  if (id.length < 4) return '****';
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 4) return '****';
  return '*'.repeat(digitsOnly.length - 4) + digitsOnly.slice(-4);
}

/**
 * POST /api/schemes/kaveri/calculate
 * Calculate Kaveri 2.0 guidance market valuation, stamp duty, cesses, and registration fees
 */
kaveriRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = kaveriCalculateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Kaveri valuation parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = kaveriService.calculateValuationAndDuty(input);

    return res.status(200).json({
      status: 'ok',
      valuation: {
        chargeableMarketValueInr: result.chargeableMarketValueInr,
        minimumGuidanceValueInr: result.minimumGuidanceValueInr,
        isConsiderationHigher: result.isConsiderationHigher,
        stampDutyRatePercent: result.stampDutyRatePercent,
        stampDutyInr: result.stampDutyInr,
        infrastructureCessInr: result.infrastructureCessInr,
        localBodySurchargeInr: result.localBodySurchargeInr,
        registrationFeeInr: result.registrationFeeInr,
        totalPayableInr: result.totalPayableInr,
        transactionType: result.transactionType,
        propertyType: result.propertyType,
        urbanLocalBody: result.urbanLocalBody,
        subRegistrarOffice: result.subRegistrarOffice,
        district: result.district,
        maskedBuyerAadhaar: maskAadhaar(input.buyerAadhaar),
        maskedBuyerPhone: maskPhone(input.buyerPhone),
      },
      messageKn: result.messageKn,
      messageEn: result.messageEn,
    });
  } catch (err) {
    next(err);
  }
});
