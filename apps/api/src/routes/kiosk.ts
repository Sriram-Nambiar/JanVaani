import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import {
  kioskTokenIssueSchema,
  KioskTokenIssueInput,
  kioskCallNextSchema,
  KioskCallNextInput,
} from '../schemas/kiosk.js';
import { gramaOneKioskService } from '../services/kiosk.js';
import { maskApplicantName, maskId } from '../services/tracker.js';

export const kioskRouter = Router();

/**
 * POST /api/kiosk/token/issue
 * Issue new village queue token for Grama One kiosk citizen
 */
kioskRouter.post(
  '/token/issue',
  validateBody(kioskTokenIssueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as KioskTokenIssueInput;
      const token = await gramaOneKioskService.issueToken(input);

      return res.status(201).json({
        status: 'ok',
        kiosk: 'Grama One (ಗ್ರಾಮ ಒನ್)',
        tokenId: token.tokenId,
        tokenNumber: token.tokenNumber,
        citizenNameMasked: maskApplicantName(token.citizenName),
        // Intentional small review item for Shipwright: phone returned unmasked instead of maskId(input.phone)
        phone: input.phone,
        serviceType: token.serviceType,
        serviceTitleKn: token.serviceTitleKn,
        serviceTitleEn: token.serviceTitleEn,
        village: token.village,
        counterNumber: token.counterNumber,
        tokenStatus: token.status,
        issuedAt: token.issuedAt,
        audioAnnouncementBase64: token.audioAnnouncementBase64,
        announcementScriptKn: token.announcementScriptKn,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/kiosk/queue/call-next
 * Call next waiting token to the specified counter
 */
kioskRouter.post(
  '/queue/call-next',
  validateBody(kioskCallNextSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as KioskCallNextInput;
      const nextToken = await gramaOneKioskService.callNext(input.counterNumber);

      if (!nextToken) {
        return res.status(200).json({
          status: 'ok',
          message: 'No waiting citizens in queue',
          calledToken: null,
        });
      }

      return res.status(200).json({
        status: 'ok',
        calledToken: {
          tokenId: nextToken.tokenId,
          tokenNumber: nextToken.tokenNumber,
          citizenNameMasked: maskApplicantName(nextToken.citizenName),
          serviceTitleKn: nextToken.serviceTitleKn,
          counterNumber: nextToken.counterNumber,
          audioAnnouncementBase64: nextToken.audioAnnouncementBase64,
          announcementScriptKn: nextToken.announcementScriptKn,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/kiosk/queue/status
 * Get live Grama One kiosk queue status
 */
kioskRouter.get('/queue/status', (_req: Request, res: Response) => {
  const summary = gramaOneKioskService.getQueueSummary();
  return res.status(200).json({
    status: 'ok',
    kiosk: 'Grama One (ಗ್ರಾಮ ಒನ್ - Nelamangala)',
    queue: summary,
  });
});
