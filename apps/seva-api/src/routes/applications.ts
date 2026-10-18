import { Router, Request, Response } from 'express';
import { bmtcApplicationSchema } from '../schemas/bmtc.js';
import { sevaDataStore } from '../db/store.js';
import { EXPECTED_DEMO_OTP } from './otp.js';

export const applicationsRouter = Router();

/**
 * POST /api/applications
 * Submits a new BMTC student bus pass application with OTP verification and PII masking
 */
applicationsRouter.post('/', (req: Request, res: Response) => {
  const parseResult = bmtcApplicationSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_FAILED',
      message: 'One or more required fields are invalid or missing.',
      details: parseResult.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  const payload = parseResult.data;

  // Verify synthetic demo OTP 3344 before permitting submission
  const submittedOtp = (payload.demoOtp || req.body.demoOtp || '').trim();
  if (submittedOtp !== EXPECTED_DEMO_OTP) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_DEMO_OTP',
      message: 'A valid synthetic demo OTP (3344) is required to complete BMTC pass submission.',
    });
  }

  const maskedAadhaar = sevaDataStore.maskAadhaar(payload.aadhaarNumber);
  console.log(`[Seva Portal Submission] Processing submission for citizen Aadhaar: ${maskedAadhaar}`);

  const record = sevaDataStore.createApplication(payload);

  return res.status(201).json({
    success: true,
    message: 'BMTC Student Bus Pass Application submitted successfully to Seva Sindhu.',
    applicationId: record.applicationId,
    maskedAadhaar: record.maskedAadhaar,
    status: record.status,
    serviceName: record.serviceName,
    record,
    acknowledgement: {
      acknowledgementNo: record.applicationId,
      department: 'Bangalore Metropolitan Transport Corporation (BMTC)',
      portalName: 'Karnataka Seva Sindhu Digital Services (Demo)',
      submissionTimestamp: record.createdAt,
      expectedProcessingDays: 3,
      applicantName: record.studentName,
      maskedAadhaar: record.maskedAadhaar,
      route: `${record.pickupStop} ➔ ${record.destinationStop}`,
    },
  });
});
