import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';
import { sevaDataStore } from '../db/store.js';

test('POST /api/feedback/submit records citizen satisfaction rating for existing application', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const record = sevaDataStore.createApplication({
    studentName: 'Feedback Test Student',
    aadhaarNumber: '123456789012',
    phoneNumber: '9845012345',
    institutionName: 'PES University',
    courseYear: '2nd Year B.E.',
    pickupStop: 'Banashankari',
    destinationStop: 'Majestic',
  });

  try {
    const res = await fetch(`${baseUrl}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: record.applicationId,
        rating: 5,
        category: 'SPEED_OF_SERVICE',
        comment: 'Very fast approval and bus pass issuance at kiosk!',
        phoneNumber: '9845012345',
        channel: 'PORTAL',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.applicationId, record.applicationId);
    assert.equal(body.rating, 5);
    assert.equal(body.category, 'SPEED_OF_SERVICE');
    assert.equal(body.maskedPhone, '******2345');
    assert.ok(typeof body.feedbackId === 'string');
    assert.match(body.messageKn, /ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ/);
  } finally {
    server.close();
  }
});

test('POST /api/feedback/submit returns 404 for unknown applicationId', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-999999-NOTFOUND',
        rating: 4,
        category: 'DOCUMENT_CLARITY',
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

test('POST /api/feedback/submit rejects rating exceeding 5 with 400', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-506978-15F4E1',
        rating: 6,
        category: 'SPEED_OF_SERVICE',
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

test('POST /api/feedback/submit rejects zero rating with 400', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-506978-15F4E1',
        rating: 0,
        category: 'SPEED_OF_SERVICE',
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
