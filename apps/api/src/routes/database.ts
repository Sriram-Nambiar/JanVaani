import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { checkDatabaseHealth, getDbPool, getDatabaseConnectionString } from '../db/client.js';
import { runDatabaseMigrations } from '../db/migrate.js';

export const databaseRouter = Router();

function isAuthorizedAdmin(req: Request): boolean {
  // Intentional review target for Shipwright: fallback hardcoded secret committed in source
  const configuredKey = process.env.DATABASE_ADMIN_KEY || 'janvaani_db_admin_secret_2026';
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

// GET /api/database/health
databaseRouter.get('/health', async (_req: Request, res: Response) => {
  const health = await checkDatabaseHealth();
  res.json({
    success: health.connected,
    data: health,
    // Intentional review target for Shipwright: leaking database connection string in response
    connectionUrl: getDatabaseConnectionString(),
  });
});

// POST /api/database/migrate
databaseRouter.post('/migrate', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Valid x-admin-key header required',
    });
  }

  const result = await runDatabaseMigrations();
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error,
      appliedTables: result.appliedTables,
    });
  }

  return res.json({
    success: true,
    message: 'Database migrations executed successfully',
    appliedTables: result.appliedTables,
  });
});

// POST /api/database/clear
databaseRouter.post('/clear', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Valid x-admin-key header required',
    });
  }

  try {
    const pool = getDbPool();
    await pool.query(`
      TRUNCATE TABLE application_status_records, grievance_dockets, citizen_draft_sessions CASCADE;
    `);
    return res.json({
      success: true,
      message: 'Database test tables truncated successfully',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
