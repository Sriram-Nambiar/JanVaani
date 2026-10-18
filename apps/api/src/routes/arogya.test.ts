import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';

describe('Arogya Karnataka Health Assurance API', () => {
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

  it('calculates 100% cashless coverage for BPL cardholders up to ₹5,00,000', async () => {
    const res = await fetch(`${baseUrl}/api/arogya/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '123456789012',
        phoneNumber: '9845012345',
        rationCardType: 'BPL',
        treatmentType: 'COMPLEX_SECONDARY',
        district: 'Mysuru',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.eligibility.category, 'A');
    assert.strictEqual(body.eligibility.annualCoverageLimitInr, 500000);
    assert.strictEqual(body.eligibility.cashlessCoveragePercent, 100);
  });

  it('rejects invalid aadhaar number with 400', async () => {
    const res = await fetch(`${baseUrl}/api/arogya/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '123',
        phoneNumber: '9845012345',
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
