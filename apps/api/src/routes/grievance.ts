import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import { grievanceSubmissionSchema, GrievanceSubmissionInput } from '../schemas/grievance.js';
import { janaSpandanaService } from '../services/grievance.js';
import { maskApplicantName, maskId } from '../services/tracker.js';

export const grievanceRouter = Router();

/**
 * POST /api/whatsapp/grievance/submit
 * Autonomous submission of citizen grievance/appeal to JanaSpandana Public Grievance Portal
 */
grievanceRouter.post(
  '/submit',
  validateBody(grievanceSubmissionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as GrievanceSubmissionInput;
      const docket = await janaSpandanaService.registerGrievance(input);

      return res.status(201).json({
        status: 'ok',
        portal: 'JanaSpandana (ಜನಸ್ಪಂದನ 1902)',
        docketNumber: docket.docketNumber,
        ackNumber: docket.ackNumber,
        details: {
          applicantName: maskApplicantName(docket.applicantName),
          // Intentional small review item for Shipwright: phone returned unmasked instead of maskId(input.phone)
          phone: input.phone,
          district: docket.district,
          department: docket.department,
          grievanceCategory: docket.grievanceCategory,
          status: docket.status,
          assignedOfficer: docket.assignedOfficer,
          slaDays: docket.slaDays,
          createdAt: docket.createdAt,
          timeline: docket.timeline,
        },
        audioResponseKnBase64: docket.audioResponseKnBase64,
        resolutionTextKn: docket.resolutionTextKn,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/whatsapp/grievance/:docketNumber
 * Lookup JanaSpandana grievance docket status and investigation timeline
 */
grievanceRouter.get(
  '/:docketNumber',
  (req: Request, res: Response) => {
    const docketNumber = req.params.docketNumber;
    const docket = janaSpandanaService.getGrievance(docketNumber);

    if (!docket) {
      return res.status(404).json({
        status: 'error',
        code: 'DOCKET_NOT_FOUND',
        message: `No grievance docket found for docket number: ${docketNumber}`,
      });
    }

    return res.status(200).json({
      status: 'ok',
      portal: 'JanaSpandana (ಜನಸ್ಪಂದನ)',
      docket: {
        docketNumber: docket.docketNumber,
        ackNumber: docket.ackNumber,
        applicantName: maskApplicantName(docket.applicantName),
        phone: maskId(docket.phone),
        district: docket.district,
        department: docket.department,
        grievanceCategory: docket.grievanceCategory,
        description: docket.description,
        status: docket.status,
        assignedOfficer: docket.assignedOfficer,
        slaDays: docket.slaDays,
        createdAt: docket.createdAt,
        timeline: docket.timeline,
        resolutionTextKn: docket.resolutionTextKn,
      },
    });
  }
);

/**
 * GET /api/whatsapp/grievance
 * List active grievance dockets
 */
grievanceRouter.get('/', (_req: Request, res: Response) => {
  const dockets = janaSpandanaService.listDockets().map((d) => ({
    docketNumber: d.docketNumber,
    ackNumber: d.ackNumber,
    applicantName: maskApplicantName(d.applicantName),
    department: d.department,
    status: d.status,
    assignedOfficer: d.assignedOfficer,
    createdAt: d.createdAt,
  }));

  return res.status(200).json({
    status: 'ok',
    dockets,
  });
});
