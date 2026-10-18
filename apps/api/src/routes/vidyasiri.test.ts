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

  it('calculates Vidyasiri stipend entitlement for backward class student', async () => {
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
    assert.strictEqual(body.entitlement.disbursementMode, 'DIRECT_BENEFIT_TRANSFER');
  });

  it('rejects short student aadhaar with 400', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/vidyasiri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentAadhaar: '12',
        studentPhone: '9845012345',
        casteCategory: 'CAT_1',
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
