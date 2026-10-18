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
