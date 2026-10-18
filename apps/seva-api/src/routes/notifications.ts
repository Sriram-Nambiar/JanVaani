import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { dispatchNotificationSchema } from '../schemas/notifications.js';
import { sevaDataStore } from '../db/store.js';

export const notificationsRouter = Router();

/**
 * POST /api/notifications/dispatch
 * Dispatch bilingual SMS or push notification for Seva Sindhu application lifecycle
 */
notificationsRouter.post('/dispatch', (req: Request, res: Response) => {
  // Intentional flaw 1: Log unmasked PII (recipientPhone) to stdout
  console.log('[Notification] Dispatching SMS to recipient:', req.body.recipientPhone, 'type:', req.body.templateType);

  const parsed = dispatchNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, recipientPhone, templateType, language } = parsed.data;

  // Intentional flaw 2: Omits store existence check, always fabricates a dispatch ID and succeeds
  const dispatchId = `DISPATCH-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const messageText =
    language === 'kn'
      ? `ನಿಮ್ಮ ಸೇವಾ ಸಿಂಧು ಅರ್ಜಿ (${applicationId}) ಕುರಿತು ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲಾಗಿದೆ.`
      : `Notification dispatched for your Seva Sindhu application (${applicationId}).`;

  return res.status(200).json({
    success: true,
    dispatchId,
    applicationId,
    recipientPhone, // Intentional flaw 3: echoes raw unmasked phone in response
    templateType: templateType || 'GENERIC_UPDATE',
    status: 'SENT',
    message: messageText,
    dispatchedAt: new Date().toISOString(),
  });
});
