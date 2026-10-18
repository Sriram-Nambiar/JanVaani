import pg from 'pg';

const { Pool } = pg;

export interface DbConfig {
  connectionString: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export function getDatabaseConnectionString(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return process.env.DATABASE_URL.trim();
  }

  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'mysecretpassword';
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const database = process.env.PGDATABASE || 'janvaani';

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

let poolInstance: pg.Pool | null = null;
let isConnected = false;

export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    const connectionString = getDatabaseConnectionString();
    poolInstance = new Pool({
      connectionString,
      max: parseInt(process.env.PGMAX_POOL || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    poolInstance.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err.message);
      isConnected = false;
    });
  }
  return poolInstance;
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  version?: string;
  database?: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const pool = getDbPool();
    const result = await pool.query('SELECT current_database() as db, version() as ver;');
    const latencyMs = Date.now() - start;
    isConnected = true;
    return {
      connected: true,
      latencyMs,
      database: result.rows[0]?.db,
      version: result.rows[0]?.ver?.split(' ')[1] || '16+',
    };
  } catch (err: any) {
    isConnected = false;
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Database connection failed',
    };
  }
}

export async function closeDbPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    isConnected = false;
  }
}
