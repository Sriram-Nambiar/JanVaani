import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';
import { closeDbPool } from '../db/client.js';

describe('JanVaani PostgreSQL JSONB Database Endpoints', () => {
  let server: Server;
  let baseUrl: string;
  const testAdminKey = 'test_database_admin_secret_key_12345';
  const originalAdminKey = process.env.DATABASE_ADMIN_KEY;
  const originalPassword = process.env.PGPASSWORD;

  before(async () => {
    process.env.DATABASE_ADMIN_KEY = testAdminKey;
    if (!process.env.PGPASSWORD) {
      process.env.PGPASSWORD = 'mysecretpassword';
    }

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
    if (originalAdminKey !== undefined) {
      process.env.DATABASE_ADMIN_KEY = originalAdminKey;
    } else {
      delete process.env.DATABASE_ADMIN_KEY;
    }

    if (originalPassword !== undefined) {
      process.env.PGPASSWORD = originalPassword;
    } else {
      delete process.env.PGPASSWORD;
    }

    await closeDbPool();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /api/database/health', () => {
    it('returns database health status and masked URI without leaking credentials', async () => {
      const res = await fetch(`${baseUrl}/api/database/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json() as any;
      assert.strictEqual(typeof body.success, 'boolean');
      assert.ok(body.data);
      assert.strictEqual(typeof body.data.connected, 'boolean');
      assert.strictEqual(typeof body.maskedUri, 'string');
      assert.ok(body.maskedUri.includes('***'));
      assert.strictEqual(body.connectionUrl, undefined);
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

    it('rejects invalid x-admin-key with 401', async () => {
      const res = await fetch(`${baseUrl}/api/database/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'incorrect_key',
        },
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json() as any;
      assert.strictEqual(body.success, false);
    });

    it('executes database migrations with valid dynamic admin key', async () => {
      const res = await fetch(`${baseUrl}/api/database/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testAdminKey,
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

    it('clears database tables with valid admin key', async () => {
      const res = await fetch(`${baseUrl}/api/database/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testAdminKey,
        },
      });

      const body = await res.json() as any;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
    });
  });
});
