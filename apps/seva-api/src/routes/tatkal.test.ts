import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';
import { sevaDataStore } from '../db/store.js';
import { tatkalDataStore } from '../db/tatkal-store.js';

test('POST /api/tatkal/request creates expedited token with 4-hr SLA for MEDICAL_EMERGENCY', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const record = sevaDataStore.createApplication({
    studentName: 'Emergency Medical Patient',
    aadhaarNumber: '123456789012',
    phoneNumber: '9845012345',
    institutionName: 'Victoria Hospital',
    courseYear: '1st Year',
    pickupStop: 'Banashankari',
    destinationStop: 'Majestic',
  });

  try {
    const res = await fetch(`${baseUrl}/api/tatkal/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: record.applicationId,
        tatkalCategory: 'MEDICAL_EMERGENCY',
        justification: 'Urgent surgery scheduled tomorrow morning requiring immediate transport pass',
        supportingDocName: 'hospital_admission_note.pdf',
        phoneNumber: '9845012345',
        channel: 'PORTAL',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.applicationId, record.applicationId);
    assert.equal(body.tatkalCategory, 'MEDICAL_EMERGENCY');
    assert.equal(body.slaDeadlineHours, 4);
    assert.equal(body.status, 'EXPEDITED');
    assert.ok(typeof body.tatkalToken === 'string');
    assert.match(body.messageKn, /ತುರ್ತು ತತ್ಕಾಲ್/);

    // Verify stored record
    const stored = tatkalDataStore.getByToken(body.tatkalToken);
    assert.ok(stored !== null);
    assert.equal(stored.applicationId, record.applicationId);
    assert.equal(stored.slaDeadlineHours, 4);
  } finally {
    server.close();
  }
});

test('POST /api/tatkal/request creates expedited token with 24-hr SLA for EDUCATIONAL_EXAM', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const record = sevaDataStore.createApplication({
    studentName: 'Exam Student',
    aadhaarNumber: '998877665544',
    phoneNumber: '9845012345',
    institutionName: 'RVCE',
    courseYear: 'Final Year',
    pickupStop: 'Kengeri',
    destinationStop: 'Majestic',
  });

  try {
    const res = await fetch(`${baseUrl}/api/tatkal/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: record.applicationId,
        tatkalCategory: 'EDUCATIONAL_EXAM',
        justification: 'Semester examination commencing in 2 days, urgently need verified hall bus pass',
        supportingDocName: 'exam_hall_ticket.pdf',
        phoneNumber: '9845012345',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.slaDeadlineHours, 24);
  } finally {
    server.close();
  }
});

test('POST /api/tatkal/request rejects phone number mismatch with 403', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const record = sevaDataStore.createApplication({
    studentName: 'Phone Spoof Student',
    aadhaarNumber: '112233445566',
    phoneNumber: '9845012345',
    institutionName: 'BMSCE',
    courseYear: '1st Year',
    pickupStop: 'Banashankari',
    destinationStop: 'Majestic',
  });

  try {
    const res = await fetch(`${baseUrl}/api/tatkal/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: record.applicationId,
        tatkalCategory: 'EMPLOYMENT_INTERVIEW',
        justification: 'Job interview scheduled at Manyata Tech Park',
        supportingDocName: 'interview_call_letter.pdf',
        phoneNumber: '9111111111', // Mismatched phone
      }),
    });

    assert.equal(res.status, 403);
    const body = (await res.json()) as any;
    assert.equal(body.success, false);
    assert.equal(body.error, 'PHONE_MISMATCH');
  } finally {
    server.close();
  }
});

test('POST /api/tatkal/request returns 404 for unknown applicationId', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/tatkal/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-999999-NOTFOUND',
        tatkalCategory: 'MEDICAL_EMERGENCY',
        justification: 'Emergency treatment pass required immediately',
        supportingDocName: 'discharge_summary.pdf',
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

test('POST /api/tatkal/request rejects short justification with 400', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/tatkal/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'SEVA-DEMO-506978-15F4E1',
        tatkalCategory: 'MEDICAL_EMERGENCY',
        justification: 'urgent', // Too short (< 10 chars)
        supportingDocName: 'doc.pdf',
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
