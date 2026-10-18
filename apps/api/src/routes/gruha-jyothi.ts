import { Router, Request, Response, NextFunction } from 'express';
import { gruhaJyothiCalculateSchema } from '../schemas/gruha-jyothi.js';
import { gruhaJyothiService } from '../services/gruha-jyothi.js';

export const gruhaJyothiRouter = Router();

function maskConsumerId(id: string): string {
  if (!id || id.length < 4) return '****';
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

function maskAadhaar(id?: string): string | undefined {
  if (!id) return undefined;
  if (id.length < 4) return '****';
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 4) return '****';
  const prefix = phone.startsWith('+') ? '+' : '';
  return prefix + '*'.repeat(digitsOnly.length - 4) + digitsOnly.slice(-4);
}

/**
 * POST /api/schemes/gruha-jyothi/calculate
 * Calculate monthly Gruha Jyothi entitlement, zero-bill eligibility, and subsidized electricity tariff
 */
gruhaJyothiRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = gruhaJyothiCalculateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Gruha Jyothi calculation parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = gruhaJyothiService.calculateBill(input);

    return res.status(200).json({
      status: 'ok',
      entitlement: {
        maskedConsumerId: maskConsumerId(result.consumerId),
        escom: result.escom,
        connectionType: result.connectionType,
        sanctionedLoadKw: result.sanctionedLoadKw,
        averageAnnualConsumptionUnits: result.averageAnnualConsumptionUnits,
        currentMonthUnits: result.currentMonthUnits,
        entitledUnits: result.entitledUnits,
        excessUnits: result.excessUnits,
        isZeroBill: result.isZeroBill,
        isDisqualified: result.isDisqualified,
        grossBillInr: result.grossBillInr,
        subsidyInr: result.subsidyInr,
        netPayableInr: result.netPayableInr,
        fixedChargeInr: result.fixedChargeInr,
        electricityTaxInr: result.electricityTaxInr,
        tariffPerUnitInr: result.tariffPerUnitInr,
        fppcaPerUnitInr: result.fppcaPerUnitInr,
        maskedPhone: maskPhone(input.contactPhone),
        maskedConsumerAadhaar: maskAadhaar(input.consumerAadhaar),
      },
      messageKn: result.messageKn,
      messageEn: result.messageEn,
    });
  } catch (err) {
    next(err);
  }
});
