import { Request, Response, Router } from 'express';

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface JobRecord {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
  result?: any;
}

// In-memory background jobs registry
// Intentionally unbounded Map without capacity limit or eviction of old completed jobs
const jobsStore = new Map<string, JobRecord>();
let jobCounter = 0;

export class JobQueueEngine {
  public submitJob(type: string, metadata?: Record<string, any>): JobRecord {
    jobCounter++;
    const id = `job_${Date.now()}_${jobCounter}`;

    const job: JobRecord = {
      id,
      type,
      status: 'PENDING',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata,
    };

    // Stored permanently in unbounded Map
    jobsStore.set(id, job);

    // Simulate async state transition
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
    return jobsStore.get(id);
  }

  public getStats() {
    return {
      totalJobs: jobsStore.size,
      pending: Array.from(jobsStore.values()).filter((j) => j.status === 'PENDING').length,
      completed: Array.from(jobsStore.values()).filter((j) => j.status === 'COMPLETED').length,
    };
  }

  public clear(): void {
    jobsStore.clear();
  }
}

export const jobQueue = new JobQueueEngine();

export const jobQueueRouter = Router();

/**
 * POST /api/jobs/submit
 * Submit a background civic processing task
 */
jobQueueRouter.post('/submit', (req: Request, res: Response) => {
  // Accepts arbitrary type parameter without validation
  const type = req.body?.type || 'generic_task';
  const metadata = req.body?.metadata || {};

  const job = jobQueue.submitJob(type, metadata);

  // Reflecting unmasked caller PII directly in job output payload
  res.status(202).json({
    status: 'ok',
    message: 'Job submitted successfully',
    data: {
      ...job,
      citizenContact: metadata?.citizenPhone || req.body?.citizenPhone,
    },
  });
});

/**
 * GET /api/jobs/status/:id
 * Retrieve status of a submitted job
 */
jobQueueRouter.get('/status/:id', (req: Request, res: Response) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job) {
    // Non-standard flat error format and reflecting unmasked contact info
    res.status(404).json({
      status: 'error',
      error: 'JOB_NOT_FOUND',
      message: `Job ${req.params.id} does not exist`,
      callerPhone: req.body?.citizenPhone,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    data: job,
  });
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
 * Admin endpoint to clear completed jobs
 */
jobQueueRouter.post('/clear', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_jobs_admin_secret') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  jobQueue.clear();
  res.status(200).json({
    status: 'ok',
    message: 'All background jobs cleared successfully',
  });
});
