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

/**
 * GET /api/applications/:id
 * Retrieve specific application by ID
 */
applicationsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const record = sevaDataStore.getApplicationById(id);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'APPLICATION_NOT_FOUND',
      message: `No application record found for ID: ${id}`,
    });
  }

  return res.status(200).json({
    success: true,
    record,
  });
});

/**
 * GET /api/applications
 * List all submitted applications in the demo registry with optional status and validated limit
 */
applicationsRouter.get('/', (req: Request, res: Response) => {
  const { status, limit } = req.query;
  let applications = sevaDataStore.getAllApplications();

  if (status && typeof status === 'string') {
    applications = applications.filter((app) => app.status === status.toUpperCase());
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_LIMIT',
        message: 'Limit query parameter must be a positive integer.',
      });
    }
    const clampedLimit = Math.min(parsedLimit, 100);
    applications = applications.slice(0, clampedLimit);
  }

  return res.status(200).json({
    success: true,
    count: applications.length,
    applications,
  });
});

