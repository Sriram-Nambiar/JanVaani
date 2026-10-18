import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';
import { sevaDataStore } from '../db/store.js';

test('POST /api/documents/attach attaches supplementary document to existing application', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const record = sevaDataStore.createApplication({
    studentName: 'Document Test Student',
    aadhaarNumber: '123456789012',
    phoneNumber: '9845012345',
    institutionName: 'BMS College of Engineering',
    courseYear: '1st Year B.E.',
    pickupStop: 'Banashankari',
    destinationStop: 'Majestic',
  });

  try {
    const res = await fetch(`${baseUrl}/api/documents/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: record.applicationId,
        documentType: 'bonafide_certificate',
        fileName: 'college_bonafide_2026.pdf',
        fileSizeKb: 145,
        phoneNumber: '9845012345',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.applicationId, record.applicationId);
    assert.equal(body.documentType, 'bonafide_certificate');
    assert.equal(body.maskedPhone, '******2345');
    assert.ok(typeof body.attachmentId === 'string');

    // Verify GET /api/documents/:applicationId reflects the attached document
    const getRes = await fetch(`${baseUrl}/api/documents/${record.applicationId}`);
    assert.equal(getRes.status, 200);
    const getBody = (await getRes.json()) as any;
    assert.equal(getBody.success, true);
    assert.ok(
      getBody.documents.some((d: any) => d.documentType === 'bonafide_certificate' && d.fileName === 'college_bonafide_2026.pdf')
    );
  } finally {
    server.close();
  }
});

test('POST /api/documents/attach returns 404 for unknown applicationId', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/documents/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-999999-NOTFOUND',
        documentType: 'student_id',
        fileName: 'student_card.pdf',
        fileSizeKb: 100,
      }),
    });

    assert.equal(res.status, 404);
    const body = (await res.json()) as any;
    assert.equal(body.success, false);
    assert.equal(body.error, 'APPLICATION_NOT_FOUND');
  } finally {
    server.close();
  }
});

test('POST /api/documents/attach rejects negative file size with 400', async () => {
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
        fileName: 'student_card.pdf',
        fileSizeKb: -50,
      }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as any;
    assert.equal(body.success, false);
    assert.equal(body.error, 'VALIDATION_ERROR');
  } finally {
    server.close();
  }
});

test('POST /api/documents/attach rejects unapproved documentType with 400', async () => {
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
        documentType: 'malware_script',
        fileName: 'script.exe',
        fileSizeKb: 100,
      }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as any;
    assert.equal(body.success, false);
    assert.equal(body.error, 'VALIDATION_ERROR');
  } finally {
    server.close();
  }
});
