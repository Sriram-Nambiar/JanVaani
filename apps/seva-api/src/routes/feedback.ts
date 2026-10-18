import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { submitFeedbackSchema } from '../schemas/feedback.js';
import { sevaDataStore } from '../db/store.js';

export const feedbackRouter = Router();

function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 4) return '****';
  return '*'.repeat(digitsOnly.length - 4) + digitsOnly.slice(-4);
}

/**
 * POST /api/feedback/submit
 * Submit citizen satisfaction rating and service feedback for a Seva Sindhu application
 */
feedbackRouter.post('/submit', (req: Request, res: Response) => {
  const parsed = submitFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, rating, category, comment, phoneNumber, channel } = parsed.data;

  const record = sevaDataStore.getApplicationById(applicationId);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'APPLICATION_NOT_FOUND',
      message: `No application found for ID ${applicationId}`,
    });
  }

  const feedbackId = `FB-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const messageKn = `ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು (ರೇಟಿಂಗ್: ${rating}/5) ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ. ಜನಸೇವೆ ಸುಧಾರಿಸಲು ನಿಮ್ಮ ಅನಿಸಿಕೆ ನಮಗೆ ಮುಖ್ಯ.`;
  const messageEn = `Your feedback (Rating: ${rating}/5) has been recorded successfully. Thank you for helping us improve citizen services.`;

  return res.status(200).json({
    success: true,
    feedbackId,
    applicationId: record.applicationId,
    rating,
    category,
    comment: comment || null,
    channel,
    maskedPhone: maskPhone(phoneNumber),
    messageKn,
    messageEn,
    submittedAt: new Date().toISOString(),
  });
});
