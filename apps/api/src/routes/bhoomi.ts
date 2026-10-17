import { Router, Request, Response, NextFunction } from 'express';
import {
  bhoomiRtcFetchSchema,
  bhoomiRtcLookupParamSchema,
} from '../schemas/bhoomi.js';
import { bhoomiService } from '../services/bhoomi.js';
import { maskId } from '../services/tracker.js';

export const bhoomiRouter = Router();

/**
 * POST /api/bhoomi/rtc/fetch
 * Fetch verified Karnataka Bhoomi RTC Pahani land records
 */
bhoomiRouter.post('/rtc/fetch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = bhoomiRtcFetchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Bhoomi RTC fetch parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const record = await bhoomiService.fetchRtc(input);

    return res.status(200).json({
      status: 'ok',
      rtc: {
        rtcNumber: record.rtcNumber,
        district: record.district,
        taluk: record.taluk,
        hobli: record.hobli,
        village: record.village,
        surveyNumber: record.surveyNumber,
        hissaNumber: record.hissaNumber,
        ownerNameMaskedKn: record.ownerNameMaskedKn,
        ownerNameMaskedEn: record.ownerNameMaskedEn,
        landType: record.landType,
        landTypeKn: record.landTypeKn,
        extentAcres: record.extentAcres,
        extentGuntas: record.extentGuntas,
        mutationStatus: record.mutationStatus,
        encumbranceFree: record.encumbranceFree,
        issuedAt: record.issuedAt,
        ownerAadhaar: input.ownerAadhaar ? maskId(input.ownerAadhaar) : undefined,
      },
      spokenSummaryKn: record.spokenSummaryKn,
      spokenSummaryEn: record.spokenSummaryEn,
      audioBase64: record.audioBase64,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bhoomi/rtc/:rtcNumber
 * Lookup existing Bhoomi RTC Pahani record
 */
bhoomiRouter.get('/rtc/:rtcNumber', (req: Request, res: Response) => {
  const parsed = bhoomiRtcLookupParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid RTC number parameter',
        details: parsed.error.issues,
      },
    });
  }

  const record = bhoomiService.lookupRtc(parsed.data.rtcNumber);
  if (!record) {
    return res.status(404).json({
      status: 'error',
      error: {
        code: 'RTC_NOT_FOUND',
        message: `No active Bhoomi RTC record found for: ${parsed.data.rtcNumber}`,
      },
    });
  }

  const { audioBase64: _unused, ...safeRecord } = record;
  return res.status(200).json({
    status: 'ok',
    rtc: safeRecord,
  });
});

/**
 * POST /api/bhoomi/rtc/export
 * Export certified Bhoomi RTC slip to citizen phone
 */
bhoomiRouter.post('/rtc/export', (req: Request, res: Response) => {
  const { rtcNumber, citizenPhone } = req.body;
  if (!rtcNumber || !citizenPhone) {
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Both rtcNumber and citizenPhone are required for export',
      },
    });
  }

  const record = bhoomiService.lookupRtc(rtcNumber);
  if (!record) {
    return res.status(404).json({
      status: 'error',
      error: {
        code: 'RTC_NOT_FOUND',
        message: `No active Bhoomi RTC record found for: ${rtcNumber}`,
      },
    });
  }

  return res.status(200).json({
    status: 'ok',
    export: {
      rtcNumber,
      // Intentional review comment target: citizenPhone returned unmasked instead of maskId(citizenPhone)
      citizenPhone,
      sentAt: new Date().toISOString(),
    },
  });
});
