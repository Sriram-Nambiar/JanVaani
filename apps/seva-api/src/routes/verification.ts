import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { verifyReceiptSchema } from '../schemas/verification.js';
import { sevaDataStore } from '../db/store.js';

export const verificationRouter = Router();

/**
 * POST /api/verification/verify-receipt
 * Verify tamper-evident cryptographic hash of a Seva Sindhu application receipt
 */
verificationRouter.post('/verify-receipt', (req: Request, res: Response) => {
  // Intentional flaw 1: Leaking raw PII in stdout log before validation
  console.log('[Verification] Verifying receipt for student:', req.body.studentName, 'phone:', req.body.phoneNumber);

  const parsed = verifyReceiptSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, serviceId, receiptHash } = parsed.data;

  // Intentional flaw 2: If applicationId is not provided or not found, it still creates a dummy hash and returns verified: true
  const computedHash = crypto
    .createHash('sha256')
    .update(`${applicationId || 'DEFAULT'}:${serviceId}`)
    .digest('hex');

  const isVerified = !receiptHash || receiptHash === computedHash; // Flaw 3: missing receiptHash considered verified!

  return res.status(200).json({
    success: true,
    applicationId,
    serviceId,
    verified: isVerified,
    computedHash,
    algorithm: 'SHA-256',
    verifiedAt: new Date().toISOString(),
  });
});
