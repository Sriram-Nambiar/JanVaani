import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { requestTatkalSchema } from '../schemas/tatkal.js';
import { sevaDataStore } from '../db/store.js';
import { tatkalDataStore, TatkalRequestRecord } from '../db/tatkal-store.js';

export const tatkalRouter = Router();

function maskPhone(phone?: string): string {
  if (!phone) return '****';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 4) return '****';
  return '******' + digitsOnly.slice(-4);
}

/**
 * POST /api/tatkal/request
 * Request emergency expedited Tatkal processing for a pending Seva Sindhu application
 */
tatkalRouter.post('/request', (req: Request, res: Response) => {
  const parsed = requestTatkalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, tatkalCategory, justification, supportingDocName, phoneNumber, channel } =
    parsed.data;

  const record = sevaDataStore.getApplicationById(applicationId);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'APPLICATION_NOT_FOUND',
      message: 'No matching Seva Sindhu application found for reference ID.',
    });
  }

  // Prevent spoofing: strictly enforce caller phone ownership against registered record
  const callerDigits = phoneNumber.replace(/\D/g, '').slice(-10);
  const recordDigits = record.phoneNumber.replace(/\D/g, '').slice(-10);
  if (callerDigits !== recordDigits) {
    return res.status(403).json({
      success: false,
      error: 'PHONE_MISMATCH',
      message: 'Provided phone number does not match registered applicant phone number.',
    });
  }

  // Idempotency guard: prevent duplicate active Tatkal requests on the same application
  const existing = tatkalDataStore.getByApplicationId(record.applicationId);
  if (existing && existing.status === 'EXPEDITED') {
    return res.status(409).json({
      success: false,
      error: 'TATKAL_ALREADY_REQUESTED',
      message: 'An emergency Tatkal expedited request is already active for this application.',
    });
  }

  const slaDeadlineHours = tatkalCategory === 'MEDICAL_EMERGENCY' ? 4 : 24;
  const requestedAtDate = new Date();
  const slaTargetDate = new Date(requestedAtDate.getTime() + slaDeadlineHours * 60 * 60 * 1000);

  const tatkalToken = `TATKAL-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const maskedPhone = maskPhone(record.phoneNumber);

  const tatkalRecord: TatkalRequestRecord = {
    tatkalToken,
    applicationId: record.applicationId,
    tatkalCategory,
    justification,
    supportingDocName,
    slaDeadlineHours,
    slaTargetTimestamp: slaTargetDate.toISOString(),
    status: 'EXPEDITED',
    channel,
    maskedPhone,
    requestedAt: requestedAtDate.toISOString(),
  };

  tatkalDataStore.saveTatkalRequest(tatkalRecord);

  const messageKn = `ತುರ್ತು ತತ್ಕಾಲ್ ಕೋರಿಕೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ (ಟೋಕನ್: ${tatkalToken}). ${slaDeadlineHours} ಗಂಟೆಗಳ ಒಳಗೆ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳ್ಳಲಿದೆ.`;
  const messageEn = `Emergency Tatkal request submitted successfully (Token: ${tatkalToken}). Fast-track SLA deadline: ${slaDeadlineHours} hours.`;

  return res.status(200).json({
    success: true,
    tatkalToken,
    applicationId: record.applicationId,
    tatkalCategory,
    slaDeadlineHours,
    slaTargetTimestamp: slaTargetDate.toISOString(),
    status: 'EXPEDITED',
    maskedPhone,
    messageKn,
    messageEn,
  });
});
