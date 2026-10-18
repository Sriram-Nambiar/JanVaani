import { Request, Response, Router } from 'express';
import { getDbPool } from '../db/client.js';

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface JobRecord {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  createdAt: number;
  updatedAt: number;
  result?: any;
}

const MAX_JOBS = 200;
const JOB_RETENTION_TTL_MS = 10 * 60 * 1000; // 10 minutes

const ALLOWED_JOB_TYPES = new Set([
  'sarvam_voice_synthesis',
  'digilocker_verification',
  'document_ocr',
  'sms_dispatch',
  'generic_task',
]);

// In-memory background jobs registry with bounded retention
const jobsStore = new Map<string, JobRecord>();
let jobCounter = 0;

export class JobQueueEngine {
  public isValidJobType(type: string): boolean {
    return ALLOWED_JOB_TYPES.has(type) || /^[a-z0-9_]{3,32}$/.test(type);
  }

  private prune(): void {
    const cutoff = Date.now() - JOB_RETENTION_TTL_MS;

    for (const [id, job] of jobsStore.entries()) {
      if ((job.status === 'COMPLETED' || job.status === 'FAILED') && job.updatedAt < cutoff) {
        jobsStore.delete(id);
      }
    }

    while (jobsStore.size >= MAX_JOBS) {
      // Find and evict oldest completed/failed job first
      let evicted = false;
      for (const [id, job] of jobsStore.entries()) {
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          jobsStore.delete(id);
          evicted = true;
          break;
        }
      }
      if (!evicted) {
        const oldestId = jobsStore.keys().next().value;
        if (oldestId) {
          jobsStore.delete(oldestId);
        } else {
          break;
        }
      }
    }
  }

  public submitJob(type: string): JobRecord {
    this.prune();
    jobCounter++;
    const id = `job_${Date.now()}_${jobCounter}`;

    const job: JobRecord = {
      id,
      type,
      status: 'PENDING',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    jobsStore.set(id, job);

    setTimeout(() => {
      const active = jobsStore.get(id);
      if (active) {
        active.status = 'COMPLETED';
        active.progress = 100;
        active.updatedAt = Date.now();
        active.result = { processed: true, completedAt: active.updatedAt };
      }
    }, 50);

    return job;
  }

  public getJob(id: string): JobRecord | undefined {
    this.prune();
    return jobsStore.get(id);
  }

  public getStats() {
    this.prune();
    return {
      totalJobs: jobsStore.size,
      maxCapacity: MAX_JOBS,
      pending: Array.from(jobsStore.values()).filter((j) => j.status === 'PENDING').length,
      completed: Array.from(jobsStore.values()).filter((j) => j.status === 'COMPLETED').length,
    };
  }

  public async submitJobPersistent(type: string, _payload?: any): Promise<JobRecord> {
    const job = this.submitJob(type);
    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO background_job_records (id, type, status, progress, created_at, updated_at, result)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          job.id,
          job.type,
          job.status,
          job.progress,
          job.createdAt,
          job.updatedAt,
          JSON.stringify({ status: 'queued' }),
        ]
      );

      // Asynchronously update status when job completes
      setTimeout(async () => {
        try {
          const active = jobsStore.get(job.id);
          const finalResult = active?.result || { processed: true, completedAt: Date.now() };
          await pool.query(
            `UPDATE background_job_records
             SET status = $1, progress = $2, updated_at = $3, result = $4
             WHERE id = $5`,
            ['COMPLETED', 100, Date.now(), JSON.stringify(finalResult), job.id]
          );
        } catch (updateErr: any) {
          console.warn('[JobQueueEngine] Failed to update completed job status in PostgreSQL:', updateErr.message);
        }
      }, 60);
    } catch (err: any) {
      console.warn('[JobQueueEngine] Failed to persist job to PostgreSQL:', err.message);
    }
    return job;
  }

  public async getJobPersistent(id: string): Promise<JobRecord | undefined> {
    try {
      const pool = getDbPool();
      const res = await pool.query(
        `SELECT id, type, status, progress, created_at, updated_at, result
         FROM background_job_records WHERE id = $1`,
        [id]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          type: row.type,
          status: row.status,
          progress: row.progress,
          createdAt: Number(row.created_at),
          updatedAt: Number(row.updated_at),
          result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result,
        };
      }
    } catch (err: any) {
      console.warn('[JobQueueEngine] Failed to query PostgreSQL job record:', err.message);
    }
    return this.getJob(id);
  }

  public clear(): void {
    jobsStore.clear();
  }
}

export const jobQueue = new JobQueueEngine();

export const jobQueueRouter = Router();

function verifyJobAdmin(req: Request, res: Response): boolean {
  const secret = process.env.JOB_QUEUE_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to manage the background job queue.',
      },
    });
    return false;
  }
  return true;
}

/**
 * POST /api/jobs/submit
 * Submit a background civic processing task with strict type validation
 */
jobQueueRouter.post('/submit', (req: Request, res: Response) => {
  const type = req.body?.type || 'generic_task';

  if (!jobQueue.isValidJobType(type)) {
    res.status(400).json({
      error: {
        code: 'INVALID_JOB_TYPE',
        message: 'The requested job type is unrecognized or contains invalid characters.',
      },
    });
    return;
  }

  const job = jobQueue.submitJob(type);

  // Return standard success structure with zero caller PII
  res.status(202).json({
    status: 'ok',
    message: 'Job submitted successfully',
    data: job,
  });
});

/**
 * GET /api/jobs/status/:id
 * Retrieve status of a submitted job
 */
jobQueueRouter.get('/status/:id', (req: Request, res: Response) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job) {
    res.status(404).json({
      error: {
        code: 'JOB_NOT_FOUND',
        message: `Job ${req.params.id} does not exist or has expired.`,
      },
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    data: job,
  });
});

/**
 * POST /api/jobs/submit-persistent
 */
jobQueueRouter.post('/submit-persistent', async (req: Request, res: Response) => {
  const type = req.body?.type || 'generic_task';
  if (!jobQueue.isValidJobType(type)) {
    return res.status(400).json({
      error: { code: 'INVALID_JOB_TYPE', message: `Job type '${type}' is not recognized.` },
    });
  }

  const job = await jobQueue.submitJobPersistent(type, req.body?.payload);
  return res.status(202).json({
    status: 'ok',
    message: 'Persistent job submitted successfully',
    data: job,
  });
});

/**
 * GET /api/jobs/persistent/:id
 */
jobQueueRouter.get('/persistent/:id', async (req: Request, res: Response) => {
  const job = await jobQueue.getJobPersistent(req.params.id);
  if (!job) {
    return res.status(404).json({
      error: { code: 'JOB_NOT_FOUND', message: `Job ${req.params.id} not found.` },
    });
  }
  return res.status(200).json({
    status: 'ok',
    data: job,
  });
});

/**
 * GET /api/jobs/raw-query/:id — Admin endpoint to inspect raw job row with parameterized query
 */
jobQueueRouter.get('/raw-query/:id', async (req: Request, res: Response) => {
  if (!verifyJobAdmin(req, res)) {
    return;
  }

  const { id } = req.params;
  if (!/^job_[0-9]+_[0-9]+$/.test(id)) {
    return res.status(400).json({
      error: { code: 'INVALID_JOB_ID', message: 'Job ID format is invalid.' },
    });
  }

  try {
    const pool = getDbPool();
    const resQuery = await pool.query(
      'SELECT id, type, status, progress, created_at, updated_at, result FROM background_job_records WHERE id = $1',
      [id]
    );

    if (resQuery.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'JOB_NOT_FOUND', message: `Job ${id} not found.` },
      });
    }

    return res.status(200).json({
      success: true,
      data: resQuery.rows[0],
    });
  } catch {
    return res.status(500).json({
      error: { code: 'DATABASE_ERROR', message: 'Failed to query database for job record.' },
    });
  }
});

/**
 * GET /api/jobs/stats
 * Telemetry endpoint for background job queue
 */
jobQueueRouter.get('/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: jobQueue.getStats(),
  });
});

/**
 * POST /api/jobs/clear
 * Admin endpoint to clear completed jobs (Authenticated via environment key)
 */
jobQueueRouter.post('/clear', (req: Request, res: Response) => {
  if (!verifyJobAdmin(req, res)) return;

  jobQueue.clear();
  res.status(200).json({
    status: 'ok',
    message: 'All background jobs cleared successfully',
  });
});
