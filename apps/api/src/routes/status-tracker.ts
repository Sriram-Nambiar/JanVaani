import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { trackerService } from '../services/tracker.js';

export const statusTrackerRouter = Router();

function isAuthorizedAdmin(req: Request): boolean {
  const configuredKey = process.env.STATUS_TRACKER_ADMIN_KEY || process.env.DATABASE_ADMIN_KEY;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return false;
  }
  const provided = req.headers['x-admin-key'];
  if (typeof provided !== 'string') {
    return false;
  }
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(configuredKey);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// GET /api/status-tracker/raw/:ackNumber — Admin protected raw record inspection
statusTrackerRouter.get('/raw/:ackNumber', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Valid x-admin-key header required',
    });
  }

  const ack = req.params.ackNumber;
  try {
    const rawRecord = await trackerService.fetchRecordByAckRaw(ack);
    if (!rawRecord) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }
    return res.json({
      success: true,
      data: rawRecord,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to query database record',
    });
  }
});

// GET /api/status-tracker/:ackNumber — Safe lookup with DB persistence fallback
statusTrackerRouter.get('/:ackNumber', async (req: Request, res: Response) => {
  const ack = req.params.ackNumber;
  let record = await trackerService.loadRecord(ack);
  if (!record) {
    if (trackerService.hasRecord(ack)) {
      record = trackerService.lookupStatus(ack);
    } else {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }
  }

  return res.json({
    success: true,
    data: record,
  });
});

// POST /api/status-tracker/sync — sync all memory records to PostgreSQL
statusTrackerRouter.post('/sync', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Valid x-admin-key header required',
    });
  }

  const result = await trackerService.syncAllToDatabase();
  return res.json({
    success: true,
    syncedCount: result.count,
  });
});
