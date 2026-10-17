import { Router, Request, Response, NextFunction } from 'express';
import {
  shaktiPassApplySchema,
  shaktiRouteCheckSchema,
  shaktiPassLookupParamSchema,
} from '../schemas/shakti.js';
import { shaktiService } from '../services/shakti.js';
import { maskId } from '../services/tracker.js';

export const shaktiRouter = Router();

/**
 * POST /api/shakti/pass/apply
 * Apply for Shakti Scheme Free Bus Travel Smart Pass
 */
shaktiRouter.post('/pass/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = shaktiPassApplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Shakti pass application parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = await shaktiService.issuePass(input);

    return res.status(201).json({
      status: 'ok',
      pass: {
        passNumber: result.passNumber,
        applicantNameMasked: result.applicantNameMasked,
        gender: result.gender,
        isKarnatakaDomicile: result.isKarnatakaDomicile,
        preferredRtc: result.preferredRtc,
        district: result.district,
        issuedAt: result.issuedAt,
        validThrough: result.validThrough,
        aadhaarNumber: maskId(input.aadhaarNumber),
      },
      spokenConfirmationKn: result.spokenConfirmationKn,
      spokenConfirmationEn: result.spokenConfirmationEn,
      audioBase64: result.audioBase64,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/shakti/route/check
 * Verify if a bus route/service is eligible for ₹0 Zero Ticket under Shakti Scheme
 */
shaktiRouter.post('/route/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = shaktiRouteCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid route check parameters',
          details: parsed.error.issues,
        },
      });
    }

    const result = await shaktiService.checkRoute(parsed.data);

    return res.status(200).json({
      status: 'ok',
      routeCheck: result,
      audioBase64: result.audioBase64,
      spokenExplanationKn: result.spokenExplanationKn,
      spokenExplanationEn: result.spokenExplanationEn,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shakti/pass/:passNumber
 * Lookup Shakti Smart Pass authenticity
 */
shaktiRouter.get('/pass/:passNumber', (req: Request, res: Response) => {
  const parsed = shaktiPassLookupParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid pass number parameter',
        details: parsed.error.issues,
      },
    });
  }

  const pass = shaktiService.lookupPass(parsed.data.passNumber);
  if (!pass) {
    return res.status(404).json({
      status: 'error',
      error: {
        code: 'PASS_NOT_FOUND',
        message: `No active Shakti Smart Pass found for: ${parsed.data.passNumber}`,
      },
    });
  }

  return res.status(200).json({
    status: 'ok',
    pass,
  });
});
