import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import { grievanceSubmissionSchema, GrievanceSubmissionInput } from '../schemas/grievance.js';
import { janaSpandanaService } from '../services/grievance.js';
import { maskApplicantName, maskId } from '../services/tracker.js';
import { getDbPool } from '../db/client.js';

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
          phone: maskId(docket.phone),
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
  async (req: Request, res: Response) => {
    const docketNumber = req.params.docketNumber;
    const docket = await janaSpandanaService.getGrievance(docketNumber);

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
grievanceRouter.get('/', async (_req: Request, res: Response) => {
  const allDockets = await janaSpandanaService.listDockets();
  const dockets = allDockets.map((d) => ({
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

function verifyGrievanceAdmin(req: Request, res: Response): boolean {
  const secret = process.env.GRIEVANCE_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to export grievance records.',
      },
    });
    return false;
  }
  return true;
}

/**
 * GET /api/whatsapp/grievance/raw-export/:docketNumber
 * Secure admin export of grievance docket with parameterized query and masked PII
 */
grievanceRouter.get('/raw-export/:docketNumber', async (req: Request, res: Response) => {
  if (!verifyGrievanceAdmin(req, res)) {
    return;
  }

  const { docketNumber } = req.params;
  if (!/^JS-2026-[0-9A-F]{6}$/i.test(docketNumber)) {
    return res.status(400).json({
      error: { code: 'INVALID_DOCKET_NUMBER', message: 'Invalid docket number format.' },
    });
  }

  try {
    const pool = getDbPool();
    const resQuery = await pool.query(
      'SELECT docket_number, ack_number, applicant_name, phone, district, department, grievance_category, description, status, assigned_officer, sla_days, timeline, resolution_text_kn, created_at FROM grievance_dockets WHERE UPPER(docket_number) = UPPER($1)',
      [docketNumber]
    );
    const row = resQuery.rows[0];
    if (!row) {
      return res.status(404).json({
        error: { code: 'DOCKET_NOT_FOUND', message: `No grievance docket found for docket number: ${docketNumber}` },
      });
    }
    return res.status(200).json({
      success: true,
      docketNumber: row.docket_number,
      applicantName: maskApplicantName(row.applicant_name),
      phone: maskId(row.phone),
      department: row.department,
      status: row.status,
    });
  } catch {
    return res.status(500).json({
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve grievance docket record.' },
    });
  }
});
