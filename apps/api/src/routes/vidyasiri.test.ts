import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';

describe('Vidyasiri ePASS Food and Accommodation Scheme API', () => {
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

  it('calculates ₹1,500/mo and ₹15,000/yr entitlement for backward class student', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/vidyasiri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentAadhaar: '123456789012',
        studentPhone: '9845012345',
        studentName: 'Basavaraj Patil',
        casteCategory: 'CAT_2A',
        annualFamilyIncomeInr: 75000,
        distanceKm: 18,
        residingInGovtHostel: false,
        courseLevel: 'UNDERGRADUATE',
        district: 'Dharwad',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, true);
    assert.strictEqual(body.entitlement.monthlyStipendInr, 1500);
    assert.strictEqual(body.entitlement.annualStipendInr, 15000);
    assert.strictEqual(body.entitlement.tenureMonths, 10);
    assert.strictEqual(body.entitlement.disbursementMode, 'DIRECT_BENEFIT_TRANSFER');
    assert.strictEqual(body.entitlement.maskedStudentAadhaar, '********9012');
  });

  it('rejects eligibility when distance between home and college is under 5 km', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/vidyasiri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentAadhaar: '123456789012',
        studentPhone: '9845012345',
        casteCategory: 'CAT_1',
        annualFamilyIncomeInr: 50000,
        distanceKm: 3,
        residingInGovtHostel: false,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, false);
    assert.strictEqual(body.entitlement.annualStipendInr, 0);
  });

  it('rejects eligibility when student already resides in a government hostel', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/vidyasiri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentAadhaar: '123456789012',
        studentPhone: '9845012345',
        casteCategory: 'CAT_2A',
        annualFamilyIncomeInr: 60000,
        distanceKm: 25,
        residingInGovtHostel: true,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.isEligible, false);
  });

  it('rejects negative distance with 400', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/vidyasiri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentAadhaar: '123456789012',
        studentPhone: '9845012345',
        casteCategory: 'CAT_1',
        annualFamilyIncomeInr: 50000,
        distanceKm: -10,
      }),
    });

    assert.strictEqual(res.status, 400);
  });

  it('rejects invalid non-numeric aadhaar with 400', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/vidyasiri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentAadhaar: 'INVALID_AADHAAR',
        studentPhone: '9845012345',
        casteCategory: 'CAT_1',
        annualFamilyIncomeInr: 50000,
        distanceKm: 15,
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
