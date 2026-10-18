import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';

test('POST /api/notifications/dispatch dispatches notification for application', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/notifications/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-506978-15F4E1',
        recipientPhone: '9845012345',
        templateType: 'SUBMISSION_CONFIRMED',
        language: 'kn',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.status, 'SENT');
    assert.ok(typeof body.dispatchId === 'string');
  } finally {
    server.close();
  }
});
