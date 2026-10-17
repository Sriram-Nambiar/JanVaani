import { Router, Request, Response, NextFunction } from 'express';
import { meterCalculationSchema, meterLookupParamSchema } from '../schemas/meter.js';
import { meterSubsidyService } from '../services/meter.js';
import { maskId } from '../services/tracker.js';

export const meterRouter = Router();

/**
 * POST /api/meter/calculate
 * Calculate Gruha Jyothi 200-unit electricity subsidy and zero-bill eligibility
 */
meterRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = meterCalculationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid meter reading payload',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    if (input.currentReading < input.previousReading) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_METER_READING',
          message: 'Current reading cannot be lower than previous reading',
        },
      });
    }

    const result = await meterSubsidyService.calculateWithAudio(input);

    return res.status(200).json({
      status: 'ok',
      meter: {
        rrNumber: result.rrNumber,
        escomName: result.escomName,
        consumedUnits: result.consumedUnits,
        entitlementLimitUnits: result.entitlementLimitUnits,
        isZeroBillEligible: result.isZeroBillEligible,
        chargeableUnits: result.chargeableUnits,
        subsidyRatePerUnit: result.subsidyRatePerUnit,
        subsidyAmountSaved: result.subsidyAmountSaved,
        netPayableAmount: result.netPayableAmount,
        consumerPhone: input.consumerPhone ? maskId(input.consumerPhone) : undefined,
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
 * GET /api/meter/:rrNumber
 * Lookup meter demo parameters by RR number
 */
meterRouter.get('/:rrNumber', (req: Request, res: Response) => {
  const parsed = meterLookupParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid RR number parameter',
        details: parsed.error.issues,
      },
    });
  }

  const demo = meterSubsidyService.lookupDemo(parsed.data.rrNumber);
  if (!demo) {
    return res.status(404).json({
      status: 'error',
      code: 'METER_NOT_FOUND',
      message: `No record found for RR Number: ${parsed.data.rrNumber}`,
    });
  }

  return res.status(200).json({
    status: 'ok',
    demo,
  });
});
