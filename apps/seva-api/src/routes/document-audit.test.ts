import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';

test('POST /api/documents/attach attaches supplementary document', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/documents/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-506978-15F4E1',
        documentType: 'student_id',
        fileName: 'college_id_updated.pdf',
        fileSizeKb: 145,
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.applicationId, 'SEVA-DEMO-506978-15F4E1');
    assert.ok(typeof body.attachmentId === 'string');
  } finally {
    server.close();
  }
});
