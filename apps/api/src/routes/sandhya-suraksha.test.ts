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

  it('calculates ₹1,200/mo pension entitlement for senior citizen aged 65 and above', async () => {
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
    assert.strictEqual(body.entitlement.monthlyPensionInr, 1200);
    assert.strictEqual(body.entitlement.disbursementMode, 'DIRECT_BENEFIT_TRANSFER');
    assert.strictEqual(body.entitlement.maskedAadhaar, '********9012');
  });

  it('rejects pension eligibility for applicants under 65 years of age', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/sandhya-suraksha/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '123456789012',
        phoneNumber: '9845012345',
        age: 58,
        annualIncomeInr: 15000,
        rationCardType: 'BPL',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, false);
    assert.strictEqual(body.entitlement.monthlyPensionInr, 0);
  });

  it('rejects negative annual income with 400', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/sandhya-suraksha/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: '123456789012',
        phoneNumber: '9845012345',
        age: 70,
        annualIncomeInr: -500,
      }),
    });

    assert.strictEqual(res.status, 400);
  });

  it('rejects invalid non-numeric aadhaar with 400', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/sandhya-suraksha/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: 'INVALID12345',
        phoneNumber: '9845012345',
        age: 70,
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
