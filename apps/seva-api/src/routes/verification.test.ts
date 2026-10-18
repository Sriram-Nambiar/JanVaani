import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';
import { sevaDataStore } from '../db/store.js';
import { computeReceiptHash } from './verification.js';

test('POST /api/verification/verify-receipt verifies authentic receipt hash', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testRecord = sevaDataStore.createApplication({
    studentName: 'Verification Test Student',
    aadhaarNumber: '123456789012',
    phoneNumber: '9845012345',
    institutionName: 'RV College of Engineering',
    courseYear: '3rd Year B.E.',
    pickupStop: 'Banashankari',
    destinationStop: 'Majestic',
  });

  const validHash = computeReceiptHash(testRecord);

  try {
    const res = await fetch(`${baseUrl}/api/verification/verify-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: testRecord.applicationId,
        serviceId: testRecord.serviceId,
        receiptHash: validHash,
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.applicationId, testRecord.applicationId);
    assert.equal(body.verified, true);
    assert.equal(body.computedHash, validHash);
  } finally {
    server.close();
  }
});

test('POST /api/verification/verify-receipt rejects tampered receipt hash', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testRecord = sevaDataStore.createApplication({
    studentName: 'Verification Tamper Student',
    aadhaarNumber: '987654321098',
    phoneNumber: '9845012345',
    institutionName: 'PES University',
    courseYear: '2nd Year B.E.',
    pickupStop: 'Electronic City',
    destinationStop: 'Majestic',
  });

  const tamperedHash = 'a'.repeat(64);

  try {
    const res = await fetch(`${baseUrl}/api/verification/verify-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: testRecord.applicationId,
        serviceId: testRecord.serviceId,
        receiptHash: tamperedHash,
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.verified, false);
  } finally {
    server.close();
  }
});

test('POST /api/verification/verify-receipt returns 404 for unknown application ID', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/verification/verify-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-999999-NOTFOUND',
        serviceId: 'bmtc-student-pass',
        receiptHash: 'a'.repeat(64),
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

test('POST /api/verification/verify-receipt returns 400 for malformed hash', async () => {
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
        receiptHash: 'short-invalid-hash',
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
