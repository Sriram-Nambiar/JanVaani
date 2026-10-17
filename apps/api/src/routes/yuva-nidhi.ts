import { Router, Request, Response, NextFunction } from 'express';
import { yuvaNidhiCheckSchema, yuvaNidhiLookupParamSchema } from '../schemas/yuva-nidhi.js';
import { yuvaNidhiService } from '../services/yuva-nidhi.js';
import { maskId } from '../services/tracker.js';

export const yuvaNidhiRouter = Router();

/**
 * POST /api/yuva-nidhi/check
 * Evaluate unemployment allowance eligibility for Graduates & Diploma holders
 */
yuvaNidhiRouter.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = yuvaNidhiCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Yuva Nidhi application parameters',
          details: parsed.error.issues,
        },
      });
    }

    const input = parsed.data;
    const result = await yuvaNidhiService.checkWithAudio(input);

    return res.status(200).json({
      status: 'ok',
      eligibility: {
        educationRegNo: result.educationRegNo,
        applicantNameMasked: result.applicantNameMasked,
        qualification: result.qualification,
        passingYear: result.passingYear,
        isEligible: result.isEligible,
        benefitAmountPerMonth: result.benefitAmountPerMonth,
        maxBenefitDurationMonths: result.maxBenefitDurationMonths,
        disqualificationReasonsKn: result.disqualificationReasonsKn,
        disqualificationReasonsEn: result.disqualificationReasonsEn,
        rationCardNumber: input.rationCardNumber ? maskId(input.rationCardNumber) : undefined,
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
 * GET /api/yuva-nidhi/:educationRegNo
 * Lookup demo education and candidate parameters
 */
yuvaNidhiRouter.get('/:educationRegNo', (req: Request, res: Response) => {
  const parsed = yuvaNidhiLookupParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid registration number parameter',
        details: parsed.error.issues,
      },
    });
  }

  const demo = yuvaNidhiService.lookupDemo(parsed.data.educationRegNo);
  if (!demo) {
    return res.status(404).json({
      status: 'error',
      code: 'CANDIDATE_NOT_FOUND',
      message: `No candidate found for Registration No: ${parsed.data.educationRegNo}`,
    });
  }

  return res.status(200).json({
    status: 'ok',
    demo,
  });
});
