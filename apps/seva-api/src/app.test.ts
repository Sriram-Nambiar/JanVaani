import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './app.js';
import { SevaDataStore } from './db/store.js';
import path from 'node:path';
import os from 'node:os';

test('GET /api/health returns 200 with service information', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'seva-sindhu-demo-api');
    assert.equal(body.isDemoPortal, true);
  } finally {
    server.close();
  }
});

test('CORS rejects unauthorized origins', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://malicious-site.example.com' },
    });
    // In express cors middleware, rejecting calls callback with error, triggering error handler
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.match(data.message, /not allowed by CORS/);
  } finally {
    server.close();
  }
});

test('SevaDataStore generates properly formatted IDs and masks Aadhaar', () => {
  const tempDb = path.join(os.tmpdir(), `seva-test-${Date.now()}.json`);
  const store = new SevaDataStore(tempDb);

  const generatedId = store.generateApplicationId();
  assert.match(generatedId, /^SEVA-DEMO-\d{6}-[A-F0-9]{6}$/);

  const masked = store.maskAadhaar('443350105028');
  assert.equal(masked, 'XXXX-XXXX-5028');

  const shortMasked = store.maskAadhaar('1234');
  assert.equal(shortMasked, 'XXXX-XXXX-1234');
});

test('SevaDataStore saves and retrieves records correctly', () => {
  const tempDb = path.join(os.tmpdir(), `seva-test-${Date.now()}-2.json`);
  const store = new SevaDataStore(tempDb);

  const record = store.createApplication({
    studentName: 'Priya Sharma',
    aadhaarNumber: '443350105028',
    phoneNumber: '9876543210',
    institutionName: 'BMS College of Engineering',
    courseYear: '2nd Year B.E. Computer Science',
    pickupStop: 'Majestic Bus Stand (KBS)',
    destinationStop: 'Bull Temple Road (Basavanagudi)',
    submittedVia: 'SEVA_PORTAL',
  });

  assert.ok(record.applicationId);
  assert.equal(record.studentName, 'Priya Sharma');
  assert.equal(record.maskedAadhaar, 'XXXX-XXXX-5028');

  const retrieved = store.getApplicationById(record.applicationId);
  assert.ok(retrieved);
  assert.equal(retrieved?.applicationId, record.applicationId);
});

test('GET /api/services returns list of demo public services', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/services`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.services.length >= 3);
    assert.equal(data.services[0].id, 'bmtc-student-pass');
  } finally {
    server.close();
  }
});

test('GET /api/services/bmtc/stops lists and filters Bangalore transit stops', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const resAll = await fetch(`${baseUrl}/api/services/bmtc/stops`);
    assert.equal(resAll.status, 200);
    const dataAll = await resAll.json();
    assert.equal(dataAll.success, true);
    assert.equal(dataAll.count, 20);

    const resFiltered = await fetch(`${baseUrl}/api/services/bmtc/stops?q=majestic`);
    assert.equal(resFiltered.status, 200);
    const dataFiltered = await resFiltered.json();
    assert.equal(dataFiltered.success, true);
    assert.equal(dataFiltered.count, 1);
    assert.match(dataFiltered.stops[0], /Majestic/i);
  } finally {
    server.close();
  }
});

test('POST /api/demo/otp/send sends mock Aadhaar OTP and masks PII', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/demo/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhaarNumber: '4433 5010 5028' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.demoOtp, '3344');
    assert.equal(data.maskedAadhaar, 'XXXX-XXXX-5028');
    assert.equal(data.aadhaarNumber, undefined); // Ensure plaintext Aadhaar is not leaked

    // Invalid Aadhaar length rejection
    const resInvalid = await fetch(`${baseUrl}/api/demo/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhaarNumber: '123' }),
    });
    assert.equal(resInvalid.status, 400);
    const dataInvalid = await resInvalid.json();
    assert.equal(dataInvalid.error, 'INVALID_AADHAAR_FORMAT');
  } finally {
    server.close();
  }
});

test('POST /api/demo/otp/verify strictly validates demo OTP 3344 and rejects incorrect codes', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const resValid = await fetch(`${baseUrl}/api/demo/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: '3344' }),
    });
    assert.equal(resValid.status, 200);
    const dataValid = await resValid.json();
    assert.equal(dataValid.verified, true);

    // Incorrect OTP must be rejected
    const resInvalid = await fetch(`${baseUrl}/api/demo/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: '0000' }),
    });
    assert.equal(resInvalid.status, 400);
    const dataInvalid = await resInvalid.json();
    assert.equal(dataInvalid.verified, false);
    assert.equal(dataInvalid.error, 'INVALID_DEMO_OTP');
  } finally {
    server.close();
  }
});

test('POST /api/applications creates new BMTC bus pass application', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const payload = {
      studentName: 'Priya Sharma',
      aadhaarNumber: '4433 5010 5028',
      phoneNumber: '9876543210',
      institutionName: 'BMS College of Engineering',
      courseYear: '2nd Year B.E. Computer Science',
      pickupStop: 'Majestic Bus Stand (KBS)',
      destinationStop: 'Bull Temple Road (Basavanagudi)',
      demoOtp: '3344',
      submittedVia: 'SEVA_PORTAL',
    };

    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.applicationId.startsWith('SEVA-DEMO-'));
    assert.equal(data.status, 'RECEIVED');
    assert.equal(data.record.studentName, 'Priya Sharma');
    assert.equal(data.maskedAadhaar, 'XXXX-XXXX-5028');
    assert.equal(data.aadhaarNumber, undefined); // Ensure plaintext Aadhaar is not exposed

    // Ensure application submission without correct OTP 3344 is rejected
    const unverifiedPayload = { ...payload, demoOtp: '9999' };
    const resInvalid = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unverifiedPayload),
    });
    assert.equal(resInvalid.status, 400);
    const dataInvalid = await resInvalid.json();
    assert.equal(dataInvalid.error, 'INVALID_DEMO_OTP');
  } finally {
    server.close();
  }
});

test('GET /api/applications/:id returns application details', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const resList = await fetch(`${baseUrl}/api/applications`);
    assert.equal(resList.status, 200);
    const dataList = await resList.json();
    assert.ok(dataList.applications.length > 0);

    const firstId = dataList.applications[0].applicationId;
    const resItem = await fetch(`${baseUrl}/api/applications/${firstId}`);
    assert.equal(resItem.status, 200);
    const dataItem = await resItem.json();
    assert.equal(dataItem.success, true);
    assert.equal(dataItem.record.applicationId, firstId);
  } finally {
    server.close();
  }
});




