import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';
import { closeRedis } from '../services/redis.js';

describe('JanVaani Redis Cache & Idempotency Endpoints', () => {
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
    await closeRedis();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /api/redis/health', () => {
    it('returns redis health status and masked uri', async () => {
      const res = await fetch(`${baseUrl}/api/redis/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json() as any;
      assert.strictEqual(typeof body.success, 'boolean');
      assert.ok(body.data);
      assert.strictEqual(typeof body.maskedUri, 'string');
    });
  });

  describe('POST /api/redis/test-idempotency', () => {
    it('rejects missing messageId with 400', async () => {
      const res = await fetch(`${baseUrl}/api/redis/test-idempotency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json() as any;
      assert.strictEqual(body.success, false);
    });

    it('records message and detects duplicate transmission', async () => {
      const uniqueMsgId = `test_msg_${Date.now()}_${Math.random()}`;

      // First call -> new
      const res1 = await fetch(`${baseUrl}/api/redis/test-idempotency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: uniqueMsgId }),
      });
      assert.strictEqual(res1.status, 200);
      const body1 = await res1.json() as any;
      assert.strictEqual(body1.success, true);
      assert.strictEqual(body1.data.isDuplicate, false);

      // Second call -> duplicate detected
      const res2 = await fetch(`${baseUrl}/api/redis/test-idempotency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: uniqueMsgId }),
      });
      assert.strictEqual(res2.status, 200);
      const body2 = await res2.json() as any;
      assert.strictEqual(body2.success, true);
      assert.strictEqual(body2.data.isDuplicate, true);
    });
  });

  describe('POST /api/redis/flush-cache', () => {
    it('rejects unauthorized flush call with 401', async () => {
      const res = await fetch(`${baseUrl}/api/redis/flush-cache`, {
        method: 'POST',
      });
      assert.strictEqual(res.status, 401);
    });

    it('flushes redis cache with admin key', async () => {
      const res = await fetch(`${baseUrl}/api/redis/flush-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.REDIS_ADMIN_KEY || 'janvaani_redis_secret_key_2026',
        },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json() as any;
      assert.strictEqual(body.success, true);
    });
  });
});
