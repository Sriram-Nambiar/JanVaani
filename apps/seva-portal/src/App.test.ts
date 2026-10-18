import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Header component enforces prominent demo disclaimer banner', () => {
  const headerPath = path.resolve(process.cwd(), 'apps/seva-portal/src/components/Header.tsx');
  const content = fs.readFileSync(headerPath, 'utf-8');

  // Assert that Header source contains the required government demo disclaimer
  assert.match(content, /Demo Portal — Not An Official Government Website/i);
  assert.match(content, /BMTC Concessional Pass System/i);
  assert.match(content, /Independent Portal \(Port 5174\)/);
});

test('ServiceCatalog includes BMTC Student Concessional Bus Pass service card', () => {
  const catalogPath = path.resolve(process.cwd(), 'apps/seva-portal/src/components/ServiceCatalog.tsx');
  const content = fs.readFileSync(catalogPath, 'utf-8');

  assert.match(content, /BMTC Student Concessional Bus Pass/i);
  assert.match(content, /Transport Department \(BMTC\)/i);
  assert.match(content, /Apply Now/i);
});

test('BmtcApplicationForm includes 4-step wizard and one-click demo filler', () => {
  const formPath = path.resolve(process.cwd(), 'apps/seva-portal/src/components/BmtcApplicationForm.tsx');
  const content = fs.readFileSync(formPath, 'utf-8');

  assert.match(content, /Priya Sharma/);
  assert.match(content, /4433 5010 5028/);
  assert.match(content, /3344/);
  assert.match(content, /Banashankari TTMC/);
  assert.match(content, /Majestic/);
});

test('StatusTracker supports application status lookup', () => {
  const trackerPath = path.resolve(process.cwd(), 'apps/seva-portal/src/components/StatusTracker.tsx');
  const content = fs.readFileSync(trackerPath, 'utf-8');

  assert.match(content, /Track Citizen Application Status/i);
  assert.match(content, /\/api\/applications\//);
});

test('StatusTracker includes copy reference ID and printable acknowledgement slip actions', () => {
  const trackerPath = path.resolve(process.cwd(), 'apps/seva-portal/src/components/StatusTracker.tsx');
  const content = fs.readFileSync(trackerPath, 'utf-8');

  assert.match(content, /Copy Reference ID/i);
  assert.match(content, /Print Acknowledgement Slip/i);
});

