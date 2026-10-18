import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';
import { closeDbPool } from '../db/client.js';

describe('JanVaani Application Status Tracker Persistence Endpoints', () => {
  let server: Server;
  let baseUrl: string;
  const testAdminKey = 'test_status_tracker_admin_secret_9988';
  const originalAdminKey = process.env.STATUS_TRACKER_ADMIN_KEY;
  const originalPassword = process.env.PGPASSWORD;

  before(async () => {
    process.env.STATUS_TRACKER_ADMIN_KEY = testAdminKey;
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
      process.env.STATUS_TRACKER_ADMIN_KEY = originalAdminKey;
    } else {
      delete process.env.STATUS_TRACKER_ADMIN_KEY;
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

  describe('POST /api/status-tracker/sync', () => {
    it('rejects unauthorized sync call with 401', async () => {
      const res = await fetch(`${baseUrl}/api/status-tracker/sync`, {
        method: 'POST',
      });
      assert.strictEqual(res.status, 401);
    });

    it('syncs seeded application status records to PostgreSQL with valid admin key', async () => {
      const res = await fetch(`${baseUrl}/api/status-tracker/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testAdminKey,
        },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json() as any;
      assert.strictEqual(body.success, true);
      assert.ok(body.syncedCount >= 3);
    });
  });

  describe('GET /api/status-tracker/:ackNumber', () => {
    it('loads application status record with JSONB timeline from database', async () => {
      const res = await fetch(`${baseUrl}/api/status-tracker/RD001`);
      assert.strictEqual(res.status, 200);
      const body = await res.json() as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.ackNumber, 'RD001');
      assert.ok(Array.isArray(body.data.timeline));
      assert.ok(body.data.timeline.length > 0);
    });

    it('returns 404 for nonexistent acknowledgment number', async () => {
      const res = await fetch(`${baseUrl}/api/status-tracker/NONEXISTENT999`);
      assert.strictEqual(res.status, 404);
      const body = await res.json() as any;
      assert.strictEqual(body.success, false);
    });
  });

  describe('GET /api/status-tracker/raw/:ackNumber', () => {
    it('fetches raw record from PostgreSQL', async () => {
      const res = await fetch(`${baseUrl}/api/status-tracker/raw/RD001`);
      assert.strictEqual(res.status, 200);
      const body = await res.json() as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.ack_number, 'RD001');
    });
  });
});
