import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';

describe('Kaveri 2.0 Property Valuation & Stamp Duty Engine API', () => {
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

  it('calculates 2% stamp duty for affordable residential apartment (<= ₹20 Lakhs)', async () => {
    // 500 sq ft @ ₹3,000/sq ft = ₹15,00,000 (<= 20L slab)
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'RESIDENTIAL_APARTMENT',
        urbanLocalBody: 'BBMP_CORE',
        transactionType: 'SALE',
        areaSqFt: 500,
        guidanceValuePerSqFt: 3000,
        buyerAadhaar: '123456789012',
        buyerPhone: '9845012345',
        district: 'Bengaluru Urban',
        subRegistrarOffice: 'Jayanagar SRO',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.valuation.chargeableMarketValueInr, 1500000);
    assert.strictEqual(body.valuation.stampDutyRatePercent, 2.0);
    assert.strictEqual(body.valuation.stampDutyInr, 30000); // 2% of 15L
    assert.strictEqual(body.valuation.registrationFeeInr, 15000); // 1% of 15L
    assert.strictEqual(body.valuation.infrastructureCessInr, 3000); // 10% of 30,000
    assert.strictEqual(body.valuation.localBodySurchargeInr, 600); // 2% of 30,000
    assert.strictEqual(body.valuation.totalPayableInr, 30000 + 15000 + 3000 + 600);
    assert.strictEqual(body.valuation.maskedBuyerAadhaar, '********9012');
    assert.strictEqual(body.valuation.maskedBuyerPhone, '******2345');
    assert.match(body.messageKn, /ಕಾವೇರಿ ೨\.೦/);
  });

  it('calculates 3% stamp duty for mid-segment residential property (> ₹20L and <= ₹45L)', async () => {
    // 1,000 sq ft @ ₹3,500/sq ft = ₹35,00,000
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'RESIDENTIAL_APARTMENT',
        urbanLocalBody: 'CITY_MUNICIPAL_COUNCIL',
        transactionType: 'SALE',
        areaSqFt: 1000,
        guidanceValuePerSqFt: 3500,
        district: 'Mysuru',
        subRegistrarOffice: 'Mysuru South SRO',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.valuation.chargeableMarketValueInr, 3500000);
    assert.strictEqual(body.valuation.stampDutyRatePercent, 3.0);
    assert.strictEqual(body.valuation.stampDutyInr, 105000); // 3% of 35L
    assert.strictEqual(body.valuation.registrationFeeInr, 35000); // 1% of 35L
  });

  it('calculates 5% standard stamp duty for luxury property (> ₹45 Lakhs)', async () => {
    // 1,200 sq ft @ ₹5,000/sq ft = ₹60,00,000
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'RESIDENTIAL_PLOT',
        urbanLocalBody: 'BBMP_PERIPHERY',
        transactionType: 'SALE',
        areaSqFt: 1200,
        guidanceValuePerSqFt: 5000,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.valuation.chargeableMarketValueInr, 6000000);
    assert.strictEqual(body.valuation.stampDutyRatePercent, 5.0);
    assert.strictEqual(body.valuation.stampDutyInr, 300000); // 5% of 60L
    assert.strictEqual(body.valuation.registrationFeeInr, 60000); // 1% of 60L
  });

  it('applies 3% surcharge for rural Gram Panchayat properties', async () => {
    // 2,000 sq ft @ ₹1,000/sq ft = ₹20,00,000
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'RESIDENTIAL_PLOT',
        urbanLocalBody: 'GRAM_PANCHAYAT',
        transactionType: 'SALE',
        areaSqFt: 2000,
        guidanceValuePerSqFt: 1000,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.valuation.stampDutyInr, 40000); // 2% of 20L
    assert.strictEqual(body.valuation.localBodySurchargeInr, 1200); // 3% of 40,000
  });

  it('charges on declared consideration when higher than guidance value', async () => {
    // Guidance = 1000 * 2000 = 20,00,000; Declared = 25,00,000
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'RESIDENTIAL_APARTMENT',
        urbanLocalBody: 'BBMP_CORE',
        transactionType: 'SALE',
        areaSqFt: 1000,
        guidanceValuePerSqFt: 2000,
        declaredConsiderationInr: 2500000,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.valuation.minimumGuidanceValueInr, 2000000);
    assert.strictEqual(body.valuation.chargeableMarketValueInr, 2500000);
    assert.strictEqual(body.valuation.isConsiderationHigher, true);
    assert.strictEqual(body.valuation.stampDutyRatePercent, 3.0);
    assert.strictEqual(body.valuation.stampDutyInr, 75000); // 3% of 25L
  });

  it('applies flat concessional fee for GIFT_FAMILY transfer', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'RESIDENTIAL_APARTMENT',
        urbanLocalBody: 'BBMP_CORE',
        transactionType: 'GIFT_FAMILY',
        areaSqFt: 1500,
        guidanceValuePerSqFt: 6000,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.valuation.stampDutyInr, 1000);
    assert.strictEqual(body.valuation.registrationFeeInr, 1000);
    assert.strictEqual(body.valuation.infrastructureCessInr, 100); // 10% of 1000
  });

  it('rejects negative area with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'RESIDENTIAL_APARTMENT',
        urbanLocalBody: 'BBMP_CORE',
        transactionType: 'SALE',
        areaSqFt: -500,
        guidanceValuePerSqFt: 3000,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'error');
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects invalid property type with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/kaveri/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType: 'INVALID_PALACE_PROPERTY',
        urbanLocalBody: 'BBMP_CORE',
        transactionType: 'SALE',
        areaSqFt: 1000,
        guidanceValuePerSqFt: 3000,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'error');
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });
});
