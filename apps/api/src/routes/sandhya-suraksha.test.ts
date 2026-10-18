import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';

describe('Sandhya Suraksha Senior Citizen Pension API', () => {
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

  it('calculates pension entitlement for senior citizen', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/sandhya-suraksha/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '123456789012',
        phoneNumber: '9845012345',
        age: 67,
        annualIncomeInr: 18000,
        areaType: 'RURAL',
        rationCardType: 'BPL',
        district: 'Mandya',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, true);
    assert.strictEqual(body.entitlement.disbursementMode, 'DIRECT_BENEFIT_TRANSFER');
  });

  it('rejects short aadhaar with 400', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/sandhya-suraksha/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '12',
        phoneNumber: '9845012345',
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
