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
    assert.strictEqual(body.eligibility.maskedAadhaar, '********9012');
  });

  it('calculates 30% co-payment for general category capped at ₹1,50,000', async () => {
    const res = await fetch(`${baseUrl}/api/arogya/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '987654321098',
        phoneNumber: '9845012345',
        rationCardType: 'APL',
        annualIncomeInr: 300000,
        treatmentType: 'TERTIARY',
        district: 'Bengaluru Urban',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.eligibility.category, 'B');
    assert.strictEqual(body.eligibility.annualCoverageLimitInr, 150000);
    assert.strictEqual(body.eligibility.cashlessCoveragePercent, 30);
  });

  it('rejects invalid non-numeric aadhaar number with 400', async () => {
    const res = await fetch(`${baseUrl}/api/arogya/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: 'ABCD1234EFGH',
        phoneNumber: '9845012345',
      }),
    });

    assert.strictEqual(res.status, 400);
  });

  it('rejects negative annual income with 400', async () => {
    const res = await fetch(`${baseUrl}/api/arogya/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '123456789012',
        phoneNumber: '9845012345',
        annualIncomeInr: -5000,
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
