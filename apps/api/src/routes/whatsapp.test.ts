import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';
import { sarvamService } from '../services/sarvam.js';
import { schemesService } from '../services/schemes.js';
import { trackerService } from '../services/tracker.js';

describe('JanVaani WhatsApp & Voice Copilot Engine Test Suite', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Sarvam AI Service Unit Tests', () => {
    it('operates in mock mode when no live API key is present', () => {
      assert.strictEqual(sarvamService.isMockMode(), true);
    });

    it('transcribes Kannada voice input in mock mode', async () => {
      const result = await sarvamService.speechToText({}, 'gruha_lakshmi_apply');
      assert.strictEqual(result.languageCode, 'kn-IN');
      assert.ok(result.transcript.includes('ಗೃಹಲಕ್ಷ್ಮಿ'));
      assert.strictEqual(result.isMock, true);
    });

    it('synthesizes Kannada speech to valid audio base64', async () => {
      const result = await sarvamService.textToSpeech('ನಮಸ್ಕಾರ, ಜನವಾಣಿಗೆ ಸ್ವಾಗತ');
      assert.ok(result.audioBase64.length > 0);
      assert.strictEqual(result.format, 'wav');
      assert.strictEqual(result.isMock, true);
    });
  });

  describe('Schemes & Rule Engine Unit Tests', () => {
    it('extracts Gruha Lakshmi form draft from Kannada text', () => {
      const draft = schemesService.extractFormDraft(
        'ನನ್ನ ಹೆಸರು ಸವಿತಾ, ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಹಾಕಬೇಕು. ರೇಷನ್ ಕಾರ್ಡ್ RC9876543210'
      );
      assert.strictEqual(draft.schemeId, 'gruha_lakshmi');
      assert.strictEqual(draft.extractedFields.applicantName, 'ಸವಿತಾ');
      assert.strictEqual(draft.extractedFields.rationCardNumber, 'RC9876543210');
      assert.ok(draft.promptForCitizenKn.length > 0);
    });

    it('extracts Caste & Income Certificate draft when keywords match', () => {
      const draft = schemesService.extractFormDraft(
        'ನನಗೆ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಬೇಕು, 2A ಪ್ರವರ್ಗ'
      );
      assert.strictEqual(draft.schemeId, 'caste_income');
      assert.strictEqual(draft.extractedFields.casteCategory, '2A');
      assert.strictEqual(draft.extractedFields.annualIncome, 100000);
    });

    it('detects name mismatch between Aadhaar and Ration Card in Kagada-Check', () => {
      const audit = schemesService.auditDocument('aadhaar', true, 'document_check_mismatch');
      assert.strictEqual(audit.status, 'MISMATCH_DETECTED');
      assert.ok(audit.issues.length > 0);
      assert.ok(audit.spokenVerdictKn.includes('ಸವಿತಾ ಕುಮಾರಿ'));
    });

    it('verifies valid document without errors', () => {
      const audit = schemesService.auditDocument('ration_card', true, 'document_check_valid');
      assert.strictEqual(audit.status, 'VERIFIED');
      assert.strictEqual(audit.issues.length, 0);
      assert.ok(audit.spokenVerdictKn.includes('ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದೆ'));
    });
  });

  describe('Status Bell Tracker Unit Tests', () => {
    it('returns approved status for RD001', () => {
      const status = trackerService.lookupStatus('RD001');
      assert.strictEqual(status.ackNumber, 'RD001');
      assert.strictEqual(status.isReadyForDownload, true);
      assert.ok(status.spokenNotificationKn.includes('ಅನುಮೋದನೆಗೊಂಡಿದೆ'));
      assert.strictEqual(status.timeline.length, 4);
    });

    it('returns in-progress status for RD002', () => {
      const status = trackerService.lookupStatus('RD002');
      assert.strictEqual(status.ackNumber, 'RD002');
      assert.strictEqual(status.isReadyForDownload, false);
      assert.ok(status.spokenNotificationKn.includes('ಕಂದಾಯ ನಿರೀಕ್ಷಕರ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ'));
    });

    it('returns action-required status for RD003 with document issue', () => {
      const status = trackerService.lookupStatus('RD003');
      assert.strictEqual(status.ackNumber, 'RD003');
      assert.ok(status.spokenNotificationKn.includes('ವಂಶವೃಕ್ಷ'));
    });
  });

  describe('WhatsApp Civic Copilot Endpoints (POST /api/whatsapp/message)', () => {
    it('processes Dhvani-Form voice note and returns Kannada audio response', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: '+919876543210',
          type: 'voice',
          presetScenario: 'gruha_lakshmi_apply',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.feature, 'dhvani_form');
      assert.ok(data.formDraft);
      assert.strictEqual(data.formDraft.schemeId, 'gruha_lakshmi');
      assert.ok(typeof data.audioBase64 === 'string' && data.audioBase64.length > 0);
      assert.ok(data.messageKn.length > 0);
    });

    it('routes voice message with RD acknowledgment to Audio Status Bell', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: '+919876543210',
          type: 'voice',
          text: 'ನನ್ನ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD001 ಆಗಿದೆ, ಸ್ಥಿತಿ ತಿಳಿಸಿ',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.feature, 'audio_status_bell');
      assert.strictEqual(data.statusRecord.ackNumber, 'RD001');
      assert.strictEqual(data.statusRecord.isReadyForDownload, true);
      assert.ok(data.audioBase64.length > 0);
    });

    it('processes Kagada-Check document image and returns discrepancy audio note', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: '+919876543210',
          type: 'image',
          documentType: 'aadhaar',
          presetScenario: 'document_check_mismatch',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.feature, 'kagada_check');
      assert.strictEqual(data.auditResult.status, 'MISMATCH_DETECTED');
      assert.ok(data.messageKn.includes('ಸವಿತಾ ಕುಮಾರಿ'));
      assert.ok(data.audioBase64.length > 0);
    });

    it('processes direct text query for RD number', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: '+919876543210',
          type: 'text',
          text: 'RD002',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.feature, 'audio_status_bell');
      assert.strictEqual(data.statusRecord.ackNumber, 'RD002');
    });

    it('rejects invalid message payload missing required content', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: '+919876543210',
          type: 'voice',
          // Missing audioBase64, audioUrl, text, and presetScenario
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
    });
  });

  describe('Karnataka Schemes & Direct Status Endpoints', () => {
    it('GET /api/whatsapp/schemes returns supported schemes list', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.some((s: any) => s.id === 'gruha_lakshmi'));
      assert.ok(data.data.some((s: any) => s.id === 'caste_income'));
    });

    it('GET /api/whatsapp/status/:ackNumber returns status and audio for RD001', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/status/RD001`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.data.ackNumber, 'RD001');
      assert.ok(data.audioBase64.length > 0);
    });

    it('GET /api/whatsapp/webhook responds to Meta Cloud API verification challenge', async () => {
      const challengeToken = 'test_challenge_12345';
      const res = await fetch(
        `${baseUrl}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=janvaani_webhook_secret&hub.challenge=${challengeToken}`
      );
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.strictEqual(text, challengeToken);
    });

    it('GET /api/whatsapp/webhook rejects invalid token with 403', async () => {
      const res = await fetch(
        `${baseUrl}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test`
      );
      assert.strictEqual(res.status, 403);
    });

    it('POST /api/whatsapp/agent/submit-seva-sindhu submits Gruha Jyothi application to Seva Sindhu', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/agent/submit-seva-sindhu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: 'gruha_jyothi',
          fields: {
            applicantName: 'ಸವಿತಾ ಕುಮಾರಿ',
            consumerId: '1029384756',
            escomName: 'BESCOM',
          },
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.acknowledgmentNumber.startsWith('GJ-BESCOM-2026-'));
      assert.ok(data.audioBase64.length > 0);
      assert.ok(data.spokenNotificationKn.includes('ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ'));
    });
  });
});
