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

  it('evaluates escalation for a grievance', async () => {
    const res = await fetch(`${baseUrl}/api/grievance-escalation/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grievanceId: 'GRV-2026-BLR-0042',
        department: 'BESCOM',
        elapsedDays: 4,
        complainantPhone: '9845012345',
        complainantName: 'Ramesh Gowda',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.escalation.grievanceId, 'GRV-2026-BLR-0042');
    assert.strictEqual(body.escalation.department, 'BESCOM');
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
