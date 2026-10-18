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

  it('calculates ₹1,000/mo and ₹6,000 total entitlement for eligible pregnant mother', async () => {
    const res = await fetch(`${baseUrl}/api/mathrushree/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motherAadhaar: '123456789012',
        motherPhone: '9845012345',
        motherAge: 24,
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
    assert.strictEqual(body.entitlement.monthlyAllowanceInr, 1000);
    assert.strictEqual(body.entitlement.totalEntitlementInr, 6000);
    assert.strictEqual(body.entitlement.disbursementMode, 'DIRECT_BENEFIT_TRANSFER');
    assert.strictEqual(body.entitlement.maskedMotherAadhaar, '********9012');
  });

  it('rejects eligibility when mother has more than 2 living children', async () => {
    const res = await fetch(`${baseUrl}/api/mathrushree/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motherAadhaar: '123456789012',
        motherPhone: '9845012345',
        motherAge: 28,
        rationCardType: 'BPL',
        livingChildrenCount: 3,
        pregnancyTrimester: 'THIRD',
        district: 'Tumakuru',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, false);
    assert.strictEqual(body.entitlement.monthlyAllowanceInr, 0);
    assert.strictEqual(body.entitlement.totalEntitlementInr, 0);
  });

  it('rejects eligibility when mother age is below 19', async () => {
    const res = await fetch(`${baseUrl}/api/mathrushree/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motherAadhaar: '123456789012',
        motherPhone: '9845012345',
        motherAge: 18,
        rationCardType: 'BPL',
        livingChildrenCount: 0,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, false);
  });

  it('rejects invalid non-numeric aadhaar with 400', async () => {
    const res = await fetch(`${baseUrl}/api/mathrushree/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motherAadhaar: 'ABC123XYZ456',
        motherPhone: '9845012345',
      }),
    });

    assert.strictEqual(res.status, 400);
  });

  it('rejects negative living children count with 400', async () => {
    const res = await fetch(`${baseUrl}/api/mathrushree/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motherAadhaar: '123456789012',
        motherPhone: '9845012345',
        livingChildrenCount: -1,
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
