import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import { audioReceiptSchema, AudioReceiptInput } from '../schemas/audio-receipt.js';
import { audioReceiptService } from '../services/receipt.js';
import { maskId } from '../services/tracker.js';

export const receiptRouter = Router();

/**
 * POST /api/whatsapp/receipt/audio
 * Synthesizes official spoken Kannada audio entitlement receipt
 */
receiptRouter.post(
  '/audio',
  validateBody(audioReceiptSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as AudioReceiptInput;
      const receipt = await audioReceiptService.generateReceipt(input);

      return res.status(200).json({
        status: 'ok',
        ackNumber: receipt.ackNumber,
        schemeId: receipt.schemeId,
        schemeTitleKn: receipt.schemeTitleKn,
        schemeTitleEn: receipt.schemeTitleEn,
        applicantNameMasked: receipt.applicantNameMasked,
        entitlementSummaryKn: receipt.entitlementSummaryKn,
        entitlementSummaryEn: receipt.entitlementSummaryEn,
        consumerId: input.consumerId ? maskId(input.consumerId) : undefined,
        audioBase64: receipt.audioBase64,
        mimeType: receipt.mimeType,
        generatedAt: receipt.generatedAt,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/whatsapp/receipt/audio/:ackNumber
 * Retrieves existing or auto-synthesized audio receipt by ackNumber
 */
receiptRouter.get('/audio/:ackNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ackNumber = req.params.ackNumber;
    const receipt = await audioReceiptService.getReceipt(ackNumber);

    if (!receipt) {
      return res.status(404).json({
        status: 'error',
        code: 'RECEIPT_NOT_FOUND',
        message: `No audio receipt available for application acknowledgment: ${ackNumber}`,
      });
    }

    return res.status(200).json({
      status: 'ok',
      receipt,
    });
  } catch (err) {
    next(err);
  }
});
