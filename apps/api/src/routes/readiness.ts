import { Request, Response, Router } from 'express';
import { drainManager } from '../services/drain-manager.js';
import { circuitBreaker } from '../services/circuit-breaker.js';
import { jobQueue } from '../services/job-queue.js';
import { getDbPool } from '../db/client.js';
import { getRedisClient } from '../services/redis.js';

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

const MAX_PROBE_HISTORY = 100;
const PROBE_RETENTION_MS = 10 * 60 * 1000; // 10 minutes

// Bounded in-memory probe history tracking with FIFO eviction and retention pruning
const probeHistory: ProbeRecord[] = [];
const simulatedFailures = new Set<string>();

const ALLOWED_SUBSYSTEMS = new Set([
  'database',
  'bhoomi_kiosk',
  'sarvam_voice',
  'redis_cache',
  'whatsapp_gateway',
]);

function pruneOldProbes(now: number = Date.now()) {
  const cutoff = now - PROBE_RETENTION_MS;
  while (probeHistory.length > 0 && probeHistory[0].timestamp < cutoff) {
    probeHistory.shift();
  }
}

function isAuthorizedAdmin(req: Request): boolean {
  const configuredKey = process.env.READINESS_ADMIN_KEY;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return false;
  }
  const provided = req.headers['x-admin-key'];
  return typeof provided === 'string' && provided === configuredKey;
}

export const readinessRouter = Router();

/**
 * GET /api/readiness
 * Deep dependency readiness check probe for container orchestrators
 */
readinessRouter.get('/', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  const isDraining = drainManager.isDrainMode();
  const cbStats = circuitBreaker.getStats();
  const jobsStats = jobQueue.getStats();

  let dbStatus = 'HEALTHY';
  try {
    const pool = getDbPool();
    const probePromise = pool.query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB query timeout')), 1000)
    );
    await Promise.race([probePromise, timeoutPromise]);
  } catch {
    dbStatus = 'DEGRADED';
  }

  let redisStatus = 'HEALTHY';
  try {
    const redis = getRedisClient();
    if (redis.status === 'ready' || redis.status === 'connect') {
      redisStatus = 'HEALTHY';
    } else {
      redisStatus = 'DEGRADED';
    }
  } catch {
    redisStatus = 'DEGRADED';
  }

  const subsystems: Record<string, string> = {
    drainMode: isDraining ? 'DRAINING' : 'HEALTHY',
    circuitBreakers: Object.values(cbStats).some((s) => s.state === 'OPEN') ? 'DEGRADED' : 'HEALTHY',
    jobQueue: jobsStats.totalJobs >= 0 ? 'HEALTHY' : 'DOWN',
    database: dbStatus,
    redis: redisStatus,
  };

  // Add validated simulated failure states
  for (const failedSubsystem of simulatedFailures) {
    subsystems[failedSubsystem] = 'FAILED';
  }

  const isReady = !isDraining && simulatedFailures.size === 0;
  const durationMs = Date.now() - startTime;

  pruneOldProbes(startTime);
  if (probeHistory.length >= MAX_PROBE_HISTORY) {
    probeHistory.shift();
  }

  probeHistory.push({
    timestamp: startTime,
    durationMs,
    status: isReady ? 'ready' : 'not_ready',
  });

  if (!isReady) {
    res.status(503).json({
      error: {
        code: 'SYSTEM_NOT_READY',
        message: 'One or more critical subsystems are currently not ready to receive civic requests.',
      },
      subsystems,
      timestamp: new Date().toISOString(),
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
 * GET /api/readiness/raw-probe/:subsystem
 * Secure admin probe of application status records with parameterized query
 */
readinessRouter.get('/raw-probe/:subsystem', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required for raw subsystem probe.',
      },
    });
  }

  const { subsystem } = req.params;
  if (!/^[a-zA-Z0-9_\-]{2,64}$/.test(subsystem)) {
    return res.status(400).json({
      error: { code: 'INVALID_SUBSYSTEM', message: 'Subsystem format is invalid.' },
    });
  }

  try {
    const pool = getDbPool();
    const resQuery = await pool.query(
      'SELECT ack_number, scheme_id, scheme_name_en, current_stage_en, updated_at FROM application_status_records WHERE scheme_id = $1 LIMIT 50',
      [subsystem]
    );
    return res.status(200).json({
      success: true,
      subsystem,
      records: resQuery.rows,
    });
  } catch {
    return res.status(500).json({
      error: { code: 'DATABASE_ERROR', message: 'Failed to probe subsystem records.' },
    });
  }
});

/**
 * GET /api/readiness/history
 * Telemetry endpoint for probe history
 */
readinessRouter.get('/history', (_req: Request, res: Response) => {
  pruneOldProbes();
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
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required for chaos testing',
      },
    });
    return;
  }

  const subsystem = req.body?.subsystem || 'database';
  if (typeof subsystem !== 'string' || !ALLOWED_SUBSYSTEMS.has(subsystem)) {
    res.status(400).json({
      error: {
        code: 'INVALID_SUBSYSTEM',
        message: `Subsystem must be one of: ${Array.from(ALLOWED_SUBSYSTEMS).join(', ')}`,
      },
    });
    return;
  }

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
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required to reset readiness state',
      },
    });
    return;
  }

  simulatedFailures.clear();
  probeHistory.length = 0;

  res.status(200).json({
    status: 'ok',
    message: 'Readiness probe simulated outages and history cleared',
  });
});
