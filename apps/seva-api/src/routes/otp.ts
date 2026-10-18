import { Router, Request, Response } from 'express';
import { verifyOtpSchema } from '../schemas/bmtc.js';
import { sevaDataStore } from '../db/store.js';

export const otpRouter = Router();

export const EXPECTED_DEMO_OTP = '3344';

/**
 * POST /api/demo/otp/send
 * Dispatches simulated Aadhaar OTP with 12-digit validation and Aadhaar masking
 */
otpRouter.post('/send', (req: Request, res: Response) => {
  const { aadhaarNumber } = req.body;
  if (!aadhaarNumber || typeof aadhaarNumber !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_AADHAAR',
      message: 'A valid Aadhaar number string is required to send demo OTP.',
    });
  }

  const digits = aadhaarNumber.replace(/\D/g, '');
  if (digits.length !== 12) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_AADHAAR_FORMAT',
      message: 'Aadhaar must contain exactly 12 digits.',
    });
  }

  const maskedAadhaar = sevaDataStore.maskAadhaar(digits);

  return res.status(200).json({
    success: true,
    message: 'Synthetic demo OTP sent successfully to linked mobile.',
    maskedAadhaar,
    demoOtp: EXPECTED_DEMO_OTP,
    expiresInSeconds: 300,
  });
});

/**
 * POST /api/demo/otp/verify
 * Verifies synthetic demo OTP strictly against 3344 across all environments
 */
otpRouter.post('/verify', (req: Request, res: Response) => {
  const result = verifyOtpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: 'OTP parameter is required',
      details: result.error.issues,
    });
  }

  const { otp } = result.data;
  const normalizedOtp = otp.trim();

  if (normalizedOtp === EXPECTED_DEMO_OTP) {
    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Synthetic demo OTP 3344 verified successfully. (Identity simulation confirmed)',
      isDemoSimulation: true,
    });
  }

  return res.status(400).json({
    success: false,
    verified: false,
    error: 'INVALID_DEMO_OTP',
    message: 'Incorrect synthetic demo OTP. Please enter the demo verification code 3344.',
    isDemoSimulation: true,
  });
});
