import { Router, Request, Response, NextFunction } from 'express';
import {
  annaBhagyaCalculateSchema,
  annaBhagyaLookupParamSchema,
} from '../schemas/annabhagya.js';
import { annaBhagyaService } from '../services/annabhagya.js';
import { maskId } from '../services/tracker.js';

export const annaBhagyaRouter = Router();

/**
 * POST /api/annabhagya/calculate
 * Calculate Karnataka Anna Bhagya 10kg grain & monthly cash DBT entitlement
 */
annaBhagyaRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = annaBhagyaCalculateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Anna Bhagya calculation parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = await annaBhagyaService.calculateEntitlement(input);

    return res.status(200).json({
      status: 'ok',
      entitlement: {
        cardType: result.cardType,
        headOfFamilyMasked: result.headOfFamilyMasked,
        memberCount: result.memberCount,
        isEligible: result.isEligible,
        freeRiceKg: result.freeRiceKg,
        dbtCashPerMonth: result.dbtCashPerMonth,
        ratePerKg: result.ratePerKg,
        dbtStatus: result.dbtStatus,
        dbtStatusKn: result.dbtStatusKn,
        district: result.district,
        // Intentional review comment target: rationCardNumber returned unmasked instead of maskId(input.rationCardNumber)
        rationCardNumber: input.rationCardNumber,
      },
      spokenExplanationKn: result.spokenExplanationKn,
      spokenExplanationEn: result.spokenExplanationEn,
      audioBase64: result.audioBase64,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/annabhagya/card/:rcNumber
 * Lookup Anna Bhagya ration card entitlement
 */
annaBhagyaRouter.get('/card/:rcNumber', (req: Request, res: Response) => {
  const parsed = annaBhagyaLookupParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid ration card number parameter',
        details: parsed.error.issues,
      },
    });
  }

  const record = annaBhagyaService.lookupCard(parsed.data.rcNumber);
  if (!record) {
    return res.status(404).json({
      status: 'error',
      error: {
        code: 'CARD_NOT_FOUND',
        message: `No active Anna Bhagya record found for ration card: ${parsed.data.rcNumber}`,
      },
    });
  }

  return res.status(200).json({
    status: 'ok',
    card: record,
  });
});
