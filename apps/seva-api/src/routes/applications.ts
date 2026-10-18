import { Router, Request, Response } from 'express';
import { bmtcApplicationSchema } from '../schemas/bmtc.js';
import { sevaDataStore } from '../db/store.js';

export const applicationsRouter = Router();

/**
 * POST /api/applications
 * Submits a new BMTC student bus pass application
 */
applicationsRouter.post('/', (req: Request, res: Response) => {
  // PII logging issue: logs raw Aadhaar to server console
  console.log('[Seva Portal Submission] Processing submission for citizen Aadhaar:', req.body.aadhaarNumber);

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

  // Persists the application without verifying that demoOtp is provided and valid
  const record = sevaDataStore.createApplication(payload);

  return res.status(201).json({
    success: true,
    message: 'BMTC Student Bus Pass Application submitted successfully to Seva Sindhu.',
    applicationId: record.applicationId,
    aadhaarNumber: req.body.aadhaarNumber, // PII leak in response
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
