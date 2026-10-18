import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { dispatchNotificationSchema } from '../schemas/notifications.js';
import { sevaDataStore } from '../db/store.js';

export const notificationsRouter = Router();

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

function renderMessage(template: string, applicationId: string, serviceName: string, language: 'kn' | 'en'): string {
  if (language === 'kn') {
    switch (template) {
      case 'SUBMISSION_CONFIRMED':
        return `ನಿಮ್ಮ ಸೇವಾ ಸಿಂಧು ${serviceName} ಅರ್ಜಿ (${applicationId}) ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ.`;
      case 'OTP_DISPATCHED':
        return `ನಿಮ್ಮ ಸೇವಾ ಸಿಂಧು ಪರಿಶೀಲನಾ ಕೋಡ್ ರವಾನಿಸಲಾಗಿದೆ.`;
      case 'DOCUMENT_VERIFIED':
        return `ನಿಮ್ಮ ${serviceName} ದಾಖಲೆಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ.`;
      default:
        return `ನಿಮ್ಮ ಸೇವಾ ಸಿಂಧು ಅರ್ಜಿ (${applicationId}) ನವೀಕರಿಸಲಾಗಿದೆ.`;
    }
  }

  switch (template) {
    case 'SUBMISSION_CONFIRMED':
      return `Your Seva Sindhu ${serviceName} application (${applicationId}) has been successfully received.`;
    case 'OTP_DISPATCHED':
      return `Your Seva Sindhu verification code has been dispatched.`;
    case 'DOCUMENT_VERIFIED':
      return `Your documents for ${serviceName} have been verified.`;
    default:
      return `Your Seva Sindhu application (${applicationId}) status has been updated.`;
  }
}

/**
 * POST /api/notifications/dispatch
 * Dispatch bilingual SMS or push notification for Seva Sindhu application lifecycle
 */
notificationsRouter.post('/dispatch', (req: Request, res: Response) => {
  const parsed = dispatchNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, recipientPhone, templateType, language } = parsed.data;

  const record = sevaDataStore.getApplicationById(applicationId);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'APPLICATION_NOT_FOUND',
      message: `No application found for ID ${applicationId}`,
    });
  }

  const dispatchId = `DISPATCH-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const messageText = renderMessage(templateType, record.applicationId, record.serviceName, language);

  return res.status(200).json({
    success: true,
    dispatchId,
    applicationId: record.applicationId,
    maskedRecipientPhone: maskPhone(recipientPhone),
    templateType,
    status: 'SENT',
    message: messageText,
    dispatchedAt: new Date().toISOString(),
  });
});
