import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';

test('POST /api/verification/verify-receipt returns verification status', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/verification/verify-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-506978-15F4E1',
        serviceId: 'bmtc-student-pass',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.applicationId, 'SEVA-DEMO-506978-15F4E1');
    assert.equal(body.algorithm, 'SHA-256');
    assert.ok(typeof body.computedHash === 'string');
  } finally {
    server.close();
  }
});
