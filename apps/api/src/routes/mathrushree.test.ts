import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';

describe('Mathrushree Maternal Nutrition DBT API', () => {
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
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('calculates entitlement for eligible pregnant mother', async () => {
    const res = await fetch(`${baseUrl}/api/mathrushree/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motherAadhaar: '123456789012',
        motherPhone: '9845012345',
        rationCardType: 'BPL',
        livingChildrenCount: 1,
        pregnancyTrimester: 'SECOND',
        district: 'Tumakuru',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, true);
    assert.strictEqual(body.entitlement.disbursementMode, 'DIRECT_BENEFIT_TRANSFER');
  });

  it('rejects short aadhaar with 400', async () => {
    const res = await fetch(`${baseUrl}/api/mathrushree/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motherAadhaar: '123',
        motherPhone: '9845012345',
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
