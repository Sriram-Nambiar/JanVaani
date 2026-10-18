import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { verifyReceiptSchema } from '../schemas/verification.js';
import { sevaDataStore } from '../db/store.js';

export const verificationRouter = Router();

/**
 * Compute canonical tamper-evident SHA-256 hash for a stored Seva Sindhu application
 */
export function computeReceiptHash(record: {
  applicationId: string;
  serviceId: string;
  maskedAadhaar: string;
  createdAt: string;
}): string {
  const payload = `${record.applicationId}:${record.serviceId}:${record.maskedAadhaar}:${record.createdAt}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * POST /api/verification/verify-receipt
 * Verify tamper-evident cryptographic hash of a Seva Sindhu application receipt
 */
verificationRouter.post('/verify-receipt', (req: Request, res: Response) => {
  const parsed = verifyReceiptSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, serviceId, receiptHash } = parsed.data;

  const record = sevaDataStore.getApplicationById(applicationId);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'APPLICATION_NOT_FOUND',
      message: `No Seva Sindhu application found for reference ID ${applicationId}`,
    });
  }

  const computedHash = computeReceiptHash(record);
  const normalizedReceiptHash = receiptHash.toLowerCase();

  const isVerified =
    computedHash.length === normalizedReceiptHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(computedHash, 'utf-8'),
      Buffer.from(normalizedReceiptHash, 'utf-8')
    );

  return res.status(200).json({
    success: true,
    applicationId: record.applicationId,
    serviceId: record.serviceId,
    verified: isVerified,
    computedHash,
    algorithm: 'SHA-256',
    verifiedAt: new Date().toISOString(),
  });
});
