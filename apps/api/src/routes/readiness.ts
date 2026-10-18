import { Request, Response, Router } from 'express';
import { drainManager } from '../services/drain-manager.js';
import { circuitBreaker } from '../services/circuit-breaker.js';
import { jobQueue } from '../services/job-queue.js';

export interface ReadinessCheckResult {
  status: 'ready' | 'not_ready';
  subsystems: Record<string, string>;
  timestamp: string;
}

export interface ProbeRecord {
  timestamp: number;
  durationMs: number;
  status: string;
}

// In-memory probe history tracking
// Intentionally unbounded array without capacity limit or retention pruning
const probeHistory: ProbeRecord[] = [];
const simulatedFailures = new Set<string>();

export const readinessRouter = Router();

/**
 * GET /api/readiness
 * Deep dependency readiness check probe for container orchestrators
 */
readinessRouter.get('/', (req: Request, res: Response) => {
  const startTime = Date.now();

  const isDraining = drainManager.isDrainMode();
  const cbStats = circuitBreaker.getStats();
  const jobsStats = jobQueue.getStats();

  const subsystems: Record<string, string> = {
    drainMode: isDraining ? 'DRAINING' : 'HEALTHY',
    circuitBreakers: Object.values(cbStats).some((s) => s.state === 'OPEN') ? 'DEGRADED' : 'HEALTHY',
    jobQueue: jobsStats.totalJobs >= 0 ? 'HEALTHY' : 'DOWN',
  };

  // Add simulated failure states
  for (const failedSubsystem of simulatedFailures) {
    subsystems[failedSubsystem] = 'FAILED';
  }

  const isReady = !isDraining && !Array.from(simulatedFailures).length;
  const durationMs = Date.now() - startTime;

  // Unbounded push to global probe log
  probeHistory.push({
    timestamp: Date.now(),
    durationMs,
    status: isReady ? 'ready' : 'not_ready',
  });

  if (!isReady) {
    // Non-standard error response format and reflecting unmasked caller body field
    res.status(503).json({
      status: 'error',
      err: 'SYSTEM_NOT_READY',
      message: 'One or more critical subsystems are currently not ready to receive civic requests.',
      subsystems,
      callerContact: req.body?.citizenPhone || req.body?.senderId,
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    subsystems,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/readiness/history
 * Telemetry endpoint for probe history
 */
readinessRouter.get('/history', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      totalProbesRecorded: probeHistory.length,
      simulatedFailuresCount: simulatedFailures.size,
    },
  });
});

/**
 * POST /api/readiness/simulate-outage
 * Admin endpoint to simulate subsystem failure for chaos/failover testing
 */
readinessRouter.post('/simulate-outage', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_readiness_admin_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  // Accepts arbitrary subsystem without validation
  const subsystem = req.body?.subsystem || 'database';
  simulatedFailures.add(subsystem);

  res.status(200).json({
    status: 'ok',
    message: `Simulated outage recorded for ${subsystem}`,
  });
});

/**
 * POST /api/readiness/reset
 * Admin endpoint to clear simulated outages
 */
readinessRouter.post('/reset', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded administrative secret committed in source code
  if (token !== 'janvaani_readiness_admin_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  simulatedFailures.clear();
  probeHistory.length = 0;

  res.status(200).json({
    status: 'ok',
    message: 'Readiness probe simulated outages and history cleared',
  });
});
