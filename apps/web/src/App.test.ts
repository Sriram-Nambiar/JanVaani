import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('WhatsAppChat component includes Sarvam-105B conversational preset button', () => {
  const chatPath = path.resolve(process.cwd(), 'apps/web/src/components/WhatsAppChat.tsx');
  const content = fs.readFileSync(chatPath, 'utf-8');

  assert.match(content, /Sarvam-105B/);
  assert.match(content, /ಸರ್ವಂ AI ಪ್ರಶ್ನೆ/);
  assert.match(content, /ನಮಸ್ಕಾರ, ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಪಟ್ಟಿ ತಿಳಿಸಿ/);
});

test('InspectorPanel component renders Sarvam-105B Indic Conversational Engine card', () => {
  const inspectorPath = path.resolve(process.cwd(), 'apps/web/src/components/InspectorPanel.tsx');
  const content = fs.readFileSync(inspectorPath, 'utf-8');

  assert.match(content, /Sarvam-105B Indic Conversational Engine/);
  assert.match(content, /sarvam-105b-conversations/);
  assert.match(content, /sarvam_chat/);
});

test('App component mounts mode poller for live vs mock Sarvam status', () => {
  const appPath = path.resolve(process.cwd(), 'apps/web/src/App.tsx');
  const content = fs.readFileSync(appPath, 'utf-8');

  assert.match(content, /\/api\/whatsapp\/mode/);
  assert.match(content, /isMock/);
});
