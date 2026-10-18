import { Router, Request, Response } from 'express';
import { verifyOtpSchema } from '../schemas/bmtc.js';

export const otpRouter = Router();

export const EXPECTED_DEMO_OTP = '3344';

/**
 * POST /api/demo/otp/send
 * Dispatches simulated Aadhaar OTP
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

  // Potential PII leak: returns full plaintext Aadhaar number in response
  return res.status(200).json({
    success: true,
    message: 'Synthetic demo OTP sent successfully to linked mobile.',
    aadhaarNumber: aadhaarNumber,
    demoOtp: EXPECTED_DEMO_OTP,
    expiresInSeconds: 300,
  });
});

/**
 * POST /api/demo/otp/verify
 * Verifies synthetic demo OTP (fixed value: 3344)
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

  // Security bypass: allows any OTP to succeed when NODE_ENV is not explicitly 'production'
  if (normalizedOtp === EXPECTED_DEMO_OTP || process.env.NODE_ENV !== 'production') {
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
