import { Router, Request, Response, NextFunction } from 'express';
import { certificateVerificationService } from '../services/verification.js';
import { qrVerificationParamSchema } from '../schemas/verification.js';

export const verificationRouter = Router();

/**
 * GET /api/verify/:ackNumber
 * Cryptographic QR verification endpoint for official Seva Sindhu certificates
 */
verificationRouter.get('/:ackNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = qrVerificationParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid acknowledgment number parameter',
          details: parsed.error.issues,
        },
      });
    }

    const { ackNumber } = parsed.data;
    const result = await certificateVerificationService.verify(ackNumber);

    if (!result) {
      return res.status(404).json({
        status: 'error',
        code: 'CERTIFICATE_NOT_FOUND',
        message: `No authentic government record found for acknowledgment: ${ackNumber}`,
      });
    }

    return res.status(200).json({
      status: 'ok',
      verification: {
        ackNumber: result.ackNumber,
        applicantNameMasked: result.applicantNameMasked,
        schemeNameKn: result.schemeNameKn,
        schemeNameEn: result.schemeNameEn,
        currentStageKn: result.currentStageKn,
        isAuthentic: result.isAuthentic,
        verificationBadge: result.verificationBadge,
        digitalSignatureSha256: result.digitalSignatureSha256,
        issuingAuthority: result.issuingAuthority,
        aadhaarMasked: result.aadhaarMasked,
        verifiedAt: result.verifiedAt,
      },
      spokenVerificationKn: result.spokenVerificationKn,
      audioBase64: result.audioBase64,
    });
  } catch (err) {
    next(err);
  }
});
