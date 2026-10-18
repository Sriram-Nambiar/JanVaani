import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';

describe('Janaspandana Grievance SLA Escalation API', () => {
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

  it('evaluates normal priority for grievance within statutory SLA', async () => {
    const res = await fetch(`${baseUrl}/api/grievance-escalation/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grievanceId: 'GRV-2026-BLR-0042',
        department: 'BESCOM',
        elapsedDays: 2,
        complainantPhone: '9845012345',
        complainantName: 'Ramesh Gowda',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.escalation.grievanceId, 'GRV-2026-BLR-0042');
    assert.strictEqual(body.escalation.department, 'BESCOM');
    assert.strictEqual(body.escalation.slaDays, 3);
    assert.strictEqual(body.escalation.isOverdue, false);
    assert.strictEqual(body.escalation.priorityLevel, 'NORMAL');
    assert.strictEqual(body.escalation.escalationTier, 'LEVEL_1_TALUK');
    assert.strictEqual(body.escalation.maskedComplainantPhone, '******2345');
  });

  it('escalates to LEVEL_2_DISTRICT and HIGH priority when SLA is exceeded', async () => {
    const res = await fetch(`${baseUrl}/api/grievance-escalation/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grievanceId: 'GRV-2026-BLR-0043',
        department: 'BESCOM',
        elapsedDays: 4,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.escalation.slaDays, 3);
    assert.strictEqual(body.escalation.isOverdue, true);
    assert.strictEqual(body.escalation.priorityLevel, 'HIGH');
    assert.strictEqual(body.escalation.escalationTier, 'LEVEL_2_DISTRICT');
  });

  it('escalates to LEVEL_3_STATE_SECRETARIAT and CRITICAL when SLA is doubled', async () => {
    const res = await fetch(`${baseUrl}/api/grievance-escalation/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grievanceId: 'GRV-2026-BLR-0044',
        department: 'BESCOM',
        elapsedDays: 8,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.escalation.isOverdue, true);
    assert.strictEqual(body.escalation.priorityLevel, 'CRITICAL');
    assert.strictEqual(body.escalation.escalationTier, 'LEVEL_3_STATE_SECRETARIAT');
  });

  it('rejects negative elapsedDays with 400', async () => {
    const res = await fetch(`${baseUrl}/api/grievance-escalation/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grievanceId: 'GRV-2026-BLR-0045',
        department: 'BBMP',
        elapsedDays: -3,
      }),
    });

    assert.strictEqual(res.status, 400);
  });

  it('rejects short grievanceId with 400', async () => {
    const res = await fetch(`${baseUrl}/api/grievance-escalation/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grievanceId: 'G1',
        department: 'BBMP',
      }),
    });

    assert.strictEqual(res.status, 400);
  });
});
