import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';

describe('Gruha Jyothi Zero-Electricity-Bill & Tariff Engine API', () => {
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

  it('calculates 100% Zero Bill when consumption is within entitled units', async () => {
    // Average 100 units -> Entitled: 110 units. Current consumption: 95 units.
    const res = await fetch(`${baseUrl}/api/schemes/gruha-jyothi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumerId: '1023456789',
        escom: 'BESCOM',
        connectionType: 'DOMESTIC_OWNER',
        sanctionedLoadKw: 2,
        averageAnnualConsumptionUnits: 100,
        currentMonthUnits: 95,
        consumerAadhaar: '123456789012',
        contactPhone: '+919845012345',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.entitlement.entitledUnits, 110);
    assert.strictEqual(body.entitlement.isZeroBill, true);
    assert.strictEqual(body.entitlement.isDisqualified, false);
    assert.strictEqual(body.entitlement.netPayableInr, 0);
    assert.ok(body.entitlement.subsidyInr > 0);
    assert.strictEqual(body.entitlement.excessUnits, 0);
    assert.strictEqual(body.entitlement.maskedConsumerId, '******6789');
    assert.strictEqual(body.entitlement.maskedConsumerAadhaar, '********9012');
    assert.strictEqual(body.entitlement.maskedPhone, '+********2345');
    assert.match(body.messageKn, /ಶೂನ್ಯ ಬಿಲ್/);
  });

  it('disqualifies and charges full gross bill when consumption exceeds 200 units', async () => {
    // Current consumption: 215 units (> 200 cap)
    const res = await fetch(`${baseUrl}/api/schemes/gruha-jyothi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumerId: '1098765432',
        escom: 'MESCOM',
        connectionType: 'DOMESTIC_TENANT',
        sanctionedLoadKw: 3,
        averageAnnualConsumptionUnits: 150,
        currentMonthUnits: 215,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.entitlement.isZeroBill, false);
    assert.strictEqual(body.entitlement.isDisqualified, true);
    assert.strictEqual(body.entitlement.subsidyInr, 0);
    assert.strictEqual(body.entitlement.netPayableInr, body.entitlement.grossBillInr);
    assert.match(body.messageEn, /exceeds the statutory 200-unit ceiling/);
  });

  it('calculates partial subsidy when consumption is between entitled units and 200', async () => {
    // Average: 80 -> Entitled: 88 units. Current: 120 units. Excess: 32 units.
    const res = await fetch(`${baseUrl}/api/schemes/gruha-jyothi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumerId: '1055566677',
        escom: 'HESCOM',
        connectionType: 'DOMESTIC_OWNER',
        sanctionedLoadKw: 2,
        averageAnnualConsumptionUnits: 80,
        currentMonthUnits: 120,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.entitlement.isZeroBill, false);
    assert.strictEqual(body.entitlement.isDisqualified, false);
    assert.strictEqual(body.entitlement.entitledUnits, 88);
    assert.strictEqual(body.entitlement.excessUnits, 32);
    assert.strictEqual(body.entitlement.fppcaPerUnitInr, 0.37);
    assert.strictEqual(body.entitlement.fixedChargeInr, 220);
    assert.ok(body.entitlement.netPayableInr >= body.entitlement.fixedChargeInr);
    assert.ok(body.entitlement.subsidyInr > 0);
    assert.match(body.messageKn, /ಭಾಗಶಃ ಸಹಾಯಧನ/);
  });

  it('rejects invalid non-10-digit consumer ID with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/gruha-jyothi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumerId: '123', // Too short
        escom: 'BESCOM',
        connectionType: 'DOMESTIC_OWNER',
        averageAnnualConsumptionUnits: 100,
        currentMonthUnits: 80,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'error');
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects negative consumption units with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/gruha-jyothi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumerId: '1023456789',
        escom: 'BESCOM',
        connectionType: 'DOMESTIC_OWNER',
        averageAnnualConsumptionUnits: 100,
        currentMonthUnits: -20,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'error');
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects unsupported ESCOM name with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/api/schemes/gruha-jyothi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumerId: '1023456789',
        escom: 'PRIVATE_POWER_LTD',
        connectionType: 'DOMESTIC_OWNER',
        averageAnnualConsumptionUnits: 100,
        currentMonthUnits: 80,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'error');
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });
});
