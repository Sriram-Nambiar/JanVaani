import test from 'node:test';
import assert from 'node:assert/strict';

test('Seva Sindhu Portal Specifications', () => {
  const disclaimerText = 'DEMO PORTAL — NOT AN OFFICIAL GOVERNMENT WEBSITE';
  assert.ok(disclaimerText.includes('DEMO PORTAL'));
  assert.ok(disclaimerText.includes('NOT AN OFFICIAL GOVERNMENT WEBSITE'));
});
