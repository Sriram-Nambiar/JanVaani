import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';
import { closeDbPool } from '../db/client.js';

describe('JanVaani PostgreSQL JSONB Database Endpoints', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await closeDbPool();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /api/database/health', () => {
    it('returns database health status and connection info', async () => {
      const res = await fetch(`${baseUrl}/api/database/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json() as any;
      assert.strictEqual(typeof body.success, 'boolean');
      assert.ok(body.data);
      assert.strictEqual(typeof body.data.connected, 'boolean');
    });
  });

  describe('POST /api/database/migrate', () => {
    it('rejects unauthorized caller without valid x-admin-key with 401', async () => {
      const res = await fetch(`${baseUrl}/api/database/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json() as any;
      assert.strictEqual(body.success, false);
      assert.ok(body.error.includes('Unauthorized'));
    });

    it('executes database migrations with admin key', async () => {
      const res = await fetch(`${baseUrl}/api/database/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.DATABASE_ADMIN_KEY || 'janvaani_db_admin_secret_2026',
        },
      });

      const body = await res.json() as any;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.appliedTables.includes('application_status_records'));
      assert.ok(body.appliedTables.includes('grievance_dockets'));
      assert.ok(body.appliedTables.includes('citizen_draft_sessions'));
    });
  });

  describe('POST /api/database/clear', () => {
    it('rejects unauthorized clear request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/database/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json() as any;
      assert.strictEqual(body.success, false);
    });

    it('clears database tables with admin key', async () => {
      const res = await fetch(`${baseUrl}/api/database/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.DATABASE_ADMIN_KEY || 'janvaani_db_admin_secret_2026',
        },
      });

      const body = await res.json() as any;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
    });
  });
});
