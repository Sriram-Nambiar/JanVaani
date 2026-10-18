import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';
import { sarvamService } from '../services/sarvam.js';
import { schemesService } from '../services/schemes.js';
import { trackerService, maskApplicantName, maskId } from '../services/tracker.js';

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

    it('masks Indic (Kannada) applicant names preserving grapheme clusters without corrupting vowel signs', () => {
      const masked = maskApplicantName('ಸವಿತಾ ಕುಮಾರಿ');
      assert.ok(masked.includes('*'));
      assert.ok(masked.startsWith('ಸ'));
      assert.ok(masked.endsWith('ರಿ'));
      assert.strictEqual(maskId('1029384756'), '******4756');
    });

    it('registerUniqueRecord atomically registers without collision', () => {
      let callCount = 0;
      const record = trackerService.registerUniqueRecord(
        (ack) => ({
          ackNumber: ack,
          schemeNameKn: 'ಟೆಸ್ಟ್ ಯೋಜನೆ',
          schemeNameEn: 'Test Scheme',
          applicantName: 'ಟೆಸ್ಟ್',
          currentStageKn: 'ಟೆಸ್ಟ್',
          currentStageEn: 'Test',
          isReadyForDownload: false,
          timeline: [],
          spokenNotificationKn: 'ಟೆಸ್ಟ್',
          spokenNotificationEn: 'Test',
        }),
        () => {
          callCount++;
          // simulate collision on first attempt with seeded RD001
          return callCount === 1 ? 'RD001' : 'TEST-UNIQUE-001';
        }
      );

      assert.ok(record);
      assert.strictEqual(record.ackNumber, 'TEST-UNIQUE-001');
      assert.strictEqual(callCount, 2);
      assert.strictEqual(trackerService.hasRecord('TEST-UNIQUE-001'), true);
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

    it('POST /api/whatsapp/agent/submit-seva-sindhu rejects malformed payload with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/agent/submit-seva-sindhu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: 'gruha_jyothi',
          fields: {
            applicantName: 'A',
            consumerId: '123',
            escomName: 'INVALID_ESCOM',
          },
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/whatsapp/agent/submit-seva-sindhu masks citizen PII and generates high-entropy acknowledgment', async () => {
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
      assert.match(data.acknowledgmentNumber, /^GJ-BESCOM-2026-[0-9A-F]{8}$/);
      assert.ok(data.applicantName.includes('*'));
      assert.strictEqual(data.consumerId, '******4756');

      const lookupRes = await fetch(`${baseUrl}/api/whatsapp/status/${data.acknowledgmentNumber}`);
      assert.strictEqual(lookupRes.status, 200);
      const lookupData = await lookupRes.json();
      assert.strictEqual(lookupData.data.applicantName, data.applicantName);
    });

    it('POST /api/whatsapp/agent/submit-seva-sindhu submits Gruha Lakshmi application with GL-KAR- acknowledgment', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/agent/submit-seva-sindhu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: 'gruha_lakshmi',
          fields: {
            applicantName: 'ಮಂಜುಳಾ ಗೌಡ (Manjula Gowda)',
            rationCardNumber: 'RC9876543210',
            aadhaarNumber: '582910492817',
            bankAccountNumber: '9876543210123',
            ifscCode: 'SBIN0001234',
          },
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.schemeId, 'gruha_lakshmi');
      assert.match(data.acknowledgmentNumber, /^GL-KAR-2026-[0-9A-F]{8}$/);
      assert.ok(data.applicantName.includes('*'));
      assert.ok(data.bankAccountNumber.includes('*'));
    });

    it('POST /api/whatsapp/agent/submit-seva-sindhu submits Caste & Income Certificate application with RD-KAR- acknowledgment', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/agent/submit-seva-sindhu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: 'caste_income',
          fields: {
            applicantName: 'ಬಸವರಾಜ್ (Basavaraj)',
            parentOrSpouseName: 'ಶಿವಣ್ಣ (Shivanna)',
            category: 'Category-2A',
            caste: 'ಕುರುಬ (Kuruba)',
            annualIncome: 120000,
            taluk: 'ಹಾವೇರಿ (Haveri)',
            district: 'ಹಾವೇರಿ (Haveri)',
          },
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.schemeId, 'caste_income');
      assert.match(data.acknowledgmentNumber, /^RD-KAR-2026-[0-9A-F]{8}$/);
      assert.ok(data.applicantName.includes('*'));
    });

    it('POST /api/whatsapp/draft/generate-html generates print-ready bilingual application draft', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/draft/generate-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ackNumber: 'GJ-BESCOM-2026-TEST1234',
          schemeId: 'gruha_jyothi',
          applicantName: 'ಸವಿತಾ ಕುಮಾರಿ',
          consumerId: '1029384756',
          escomName: 'BESCOM',
          auditFindings: [
            {
              field: 'Aadhaar Card',
              status: 'PASSED',
              noteKn: 'ಆಧಾರ್ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
              noteEn: 'Aadhaar verified',
            },
          ],
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.html.includes('JANVAANI APPLICATION DRAFT'));
      assert.ok(data.html.includes('ಸವಿತಾ ಕುಮಾರಿ'));
      assert.ok(data.html.includes('GJ-BESCOM-2026-TEST1234'));
    });

    it('GET /api/whatsapp/draft/:ackNumber/html returns printable HTML document with record audit findings', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/draft/RD003/html`);
      assert.strictEqual(res.status, 200);
      const contentType = res.headers.get('content-type');
      assert.ok(contentType?.includes('text/html'));
      const html = await res.text();
      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('RD003'));
      assert.ok(html.includes('Family Tree Certificate'));
      assert.ok(html.includes('FLAGGED'));
    });

    it('POST /api/whatsapp/status/simulate-push rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/status/simulate-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ackNumber: 'RD002',
          stage: 'APPROVED',
        }),
      });

      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/whatsapp/status/simulate-push advances stage and generates synthesized voice notification with valid auth', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/status/simulate-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'janvaani_demo_secret',
        },
        body: JSON.stringify({
          ackNumber: 'RD002',
          stage: 'APPROVED',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.stage, 'APPROVED');
      assert.strictEqual(data.updatedRecord.isReadyForDownload, true);
      assert.ok(data.audioBase64.length > 0);
      assert.ok(data.spokenNotificationKn.includes('ಅನುಮೋದನೆಗೊಂಡಿದೆ'));
    });

    it('POST /api/whatsapp/status/simulate-push rejects invalid stage with 400', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/status/simulate-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'janvaani_demo_secret',
        },
        body: JSON.stringify({
          ackNumber: 'RD002',
          stage: 'INVALID_STAGE_NAME',
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('JanaSpandana Grievance & Appeal Redressal Endpoints', () => {
    it('POST /api/whatsapp/grievance/submit successfully lodges a citizen grievance and returns docket number', async () => {
      const payload = {
        applicantName: 'ಸವಿತಾ ಕುಮಾರಿ',
        phone: '9845012345',
        district: 'Bengaluru Urban',
        department: 'ENERGY_BESCOM',
        grievanceCategory: 'UNJUST_REJECTION',
        description: 'ಬೆಸ್ಕಾಂ ಗೃಹಜ್ಯೋತಿ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದು ಯಾವುದೇ ಕಾರಣವಿಲ್ಲದೆ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.',
      };

      const res = await fetch(`${baseUrl}/api/whatsapp/grievance/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.portal.includes('JanaSpandana'));
      assert.match(body.docketNumber, /^JS-2026-[0-9A-F]{6}$/);
      assert.strictEqual(body.details.status, 'ASSIGNED');
      assert.ok(body.details.assignedOfficer.includes('ಬೆಸ್ಕಾಂ ನೋಡಲ್ ಅಧಿಕಾರಿ'));
      assert.strictEqual(body.details.timeline.length, 4);
      assert.strictEqual(body.details.timeline[0].status, 'COMPLETED');
      assert.strictEqual(body.details.timeline[1].status, 'IN_PROGRESS');
      assert.ok(body.details.phone.includes('*'));
    });

    it('POST /api/whatsapp/grievance/submit rejects missing required fields with 400', async () => {
      const invalidPayload = {
        applicantName: 'A', // too short (< 2)
        phone: '123', // invalid phone length
        district: '',
      };

      const res = await fetch(`${baseUrl}/api/whatsapp/grievance/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('GET /api/whatsapp/grievance/:docketNumber returns docket details and inquiry timeline', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/grievance/JS-2026-B8A91C`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.docket.docketNumber, 'JS-2026-B8A91C');
      assert.strictEqual(body.docket.ackNumber, 'RD003');
      assert.ok(body.docket.applicantName.includes('*'));
      assert.ok(body.docket.phone.includes('*'));
      assert.strictEqual(body.docket.timeline.length, 4);
    });

    it('GET /api/whatsapp/grievance/:docketNumber returns 404 for unknown docket', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/grievance/JS-UNKNOWN-999`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.code, 'DOCKET_NOT_FOUND');
    });

    it('GET /api/whatsapp/grievance returns list of active dockets', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/grievance`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(Array.isArray(body.dockets));
      assert.ok(body.dockets.length >= 1);
    });
  });

  describe('Kannada Spoken Audio Receipt Endpoints', () => {
    it('POST /api/whatsapp/receipt/audio generates Gruha Jyothi voice receipt with 200 units entitlement', async () => {
      const payload = {
        ackNumber: 'GJ-BESCOM-2026-F91A2B',
        schemeId: 'gruha_jyothi',
        applicantName: 'ಸವಿತಾ ಕುಮಾರಿ',
        consumerId: '1029384756',
      };

      const res = await fetch(`${baseUrl}/api/whatsapp/receipt/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.ackNumber, 'GJ-BESCOM-2026-F91A2B');
      assert.ok(body.schemeTitleKn.includes('ಗೃಹಜ್ಯೋತಿ'));
      assert.ok(body.entitlementSummaryKn.includes('200'));
      assert.ok(body.applicantNameMasked.includes('*'));
      assert.ok(body.consumerId.includes('*'));
      assert.ok(body.audioBase64.length > 0);
    });

    it('POST /api/whatsapp/receipt/audio generates Gruha Lakshmi voice receipt', async () => {
      const payload = {
        ackNumber: 'GL-KAR-2026-C4B821',
        schemeId: 'gruha_lakshmi',
        applicantName: 'ಲಕ್ಷ್ಮೀದೇವಿ',
        rationCardNumber: 'RC9876543210',
      };

      const res = await fetch(`${baseUrl}/api/whatsapp/receipt/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.entitlementSummaryKn.includes('2,000'));
      assert.ok(body.audioBase64.length > 0);
    });

    it('POST /api/whatsapp/receipt/audio rejects invalid payload with 400', async () => {
      const invalidPayload = {
        ackNumber: 'G', // too short (< 3)
        schemeId: 'invalid_scheme',
      };

      const res = await fetch(`${baseUrl}/api/whatsapp/receipt/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('GET /api/whatsapp/receipt/audio/:ackNumber auto-synthesizes audio receipt for known RD001', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/receipt/audio/RD001`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.receipt.ackNumber, 'RD001');
      assert.ok(body.receipt.audioBase64.length > 0);
    });

    it('GET /api/whatsapp/receipt/audio/:ackNumber returns 404 for unknown acknowledgment', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/receipt/audio/UNKNOWN-NOT-EXIST`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.code, 'RECEIPT_NOT_FOUND');
    });
  });

  describe('Grama One Citizen Kiosk & Queue Endpoints', () => {
    it('POST /api/kiosk/token/issue successfully issues village queue token with spoken announcement', async () => {
      const payload = {
        citizenName: 'ಶಿವಣ್ಣ ಗೌಡ',
        phone: '9845012345',
        serviceType: 'GRUHA_JYOTHI',
        village: 'ನೆಲಮಂಗಲ',
        counterNumber: 1,
      };

      const res = await fetch(`${baseUrl}/api/kiosk/token/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.kiosk.includes('Grama One'));
      assert.match(body.tokenId, /^TOKEN-2026-\d+$/);
      assert.ok(body.citizenNameMasked.includes('*'));
      assert.ok(body.phone.includes('*'));
      assert.strictEqual(body.serviceType, 'GRUHA_JYOTHI');
      assert.ok(body.audioAnnouncementBase64.length > 0);
      assert.ok(body.announcementScriptKn.includes('ಟೋಕನ್'));
    });

    it('POST /api/kiosk/token/issue rejects invalid phone number with 400', async () => {
      const invalidPayload = {
        citizenName: 'ರಾಜು',
        phone: '123', // invalid length
        serviceType: 'GRUHA_LAKSHMI',
      };

      const res = await fetch(`${baseUrl}/api/kiosk/token/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/kiosk/queue/call-next calls next waiting citizen to counter', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/queue/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterNumber: 1 }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      if (body.calledToken) {
        assert.ok(body.calledToken.tokenNumber > 0);
        assert.strictEqual(body.calledToken.counterNumber, 1);
        assert.ok(body.calledToken.audioAnnouncementBase64.length > 0);
      }
    });

    it('GET /api/kiosk/queue/status returns live village queue summary', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/queue/status`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.queue.totalTokensIssued >= 1);
      assert.ok(typeof body.queue.waitingCount === 'number');
    });
  });

  describe('Official Certificate QR Verification & Integrity Endpoints', () => {
    it('GET /api/verify/:ackNumber returns genuine verification with cryptographic signature for RD001', async () => {
      const res = await fetch(`${baseUrl}/api/verify/RD001`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.verification.isAuthentic, true);
      assert.strictEqual(body.verification.verificationBadge, 'DIGITALLY_SIGNED_GENUINE');
      assert.strictEqual(body.verification.ackNumber, 'RD001');
      assert.strictEqual(body.verification.digitalSignatureSha256.length, 64);
      assert.ok(body.audioBase64.length > 0);
      assert.ok(body.spokenVerificationKn.includes('ದೃಢೀಕರಣ'));
    });

    it('GET /api/verify/:ackNumber returns 404 for unknown acknowledgment number', async () => {
      const res = await fetch(`${baseUrl}/api/verify/UNKNOWN-NONEXISTENT-999`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.status, 'error');
      assert.strictEqual(body.code, 'CERTIFICATE_NOT_FOUND');
    });

    it('GET /api/verify/:ackNumber rejects invalid acknowledgment format with 400', async () => {
      const res = await fetch(`${baseUrl}/api/verify/X`); // < 3 chars
      const body = await res.json();

      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('Gruha Jyothi 200-Unit Subsidy Meter Reading Endpoints', () => {
    it('POST /api/meter/calculate calculates zero-bill subsidy for consumption within quota', async () => {
      const payload = {
        rrNumber: 'BESCOM-W1-4029',
        escomName: 'BESCOM',
        previousReading: 1240,
        currentReading: 1390,
        averageMonthlyUnits: 160,
        consumerPhone: '9845012345',
      };

      const res = await fetch(`${baseUrl}/api/meter/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.meter.rrNumber, 'BESCOM-W1-4029');
      assert.strictEqual(body.meter.consumedUnits, 150);
      assert.strictEqual(body.meter.isZeroBillEligible, true);
      assert.strictEqual(body.meter.netPayableAmount, 0);
      assert.strictEqual(body.meter.consumerPhone, '******2345');
      assert.ok(body.audioBase64.length > 0);
      assert.ok(body.spokenExplanationKn.includes('ಶೂನ್ಯ ಬಿಲ್'));
    });

    it('POST /api/meter/calculate calculates excess payable bill when consumption exceeds quota', async () => {
      const payload = {
        rrNumber: 'HESCOM-HD-8102',
        escomName: 'HESCOM',
        previousReading: 2100,
        currentReading: 2320,
        averageMonthlyUnits: 180,
      };

      const res = await fetch(`${baseUrl}/api/meter/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.meter.consumedUnits, 220);
      assert.strictEqual(body.meter.isZeroBillEligible, false);
      assert.strictEqual(body.meter.chargeableUnits, 22);
      assert.strictEqual(body.meter.netPayableAmount, 154);
      assert.ok(body.audioBase64.length > 0);
    });

    it('POST /api/meter/calculate rejects currentReading < previousReading with 400', async () => {
      const payload = {
        rrNumber: 'BESCOM-W1-4029',
        escomName: 'BESCOM',
        previousReading: 1500,
        currentReading: 1400,
      };

      const res = await fetch(`${baseUrl}/api/meter/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_METER_READING');
    });

    it('GET /api/meter/:rrNumber returns demo parameters for known BESCOM-W1-4029', async () => {
      const res = await fetch(`${baseUrl}/api/meter/BESCOM-W1-4029`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.demo.rrNumber, 'BESCOM-W1-4029');
      assert.strictEqual(body.demo.escomName, 'BESCOM');
    });

    it('GET /api/meter/:rrNumber returns 404 for unknown RR number', async () => {
      const res = await fetch(`${baseUrl}/api/meter/UNKNOWN-RR-9999`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.code, 'METER_NOT_FOUND');
    });
  });

  describe('Karnataka Yuva Nidhi Allowance Endpoints', () => {
    it('POST /api/yuva-nidhi/check evaluates eligible Graduate candidate for ₹3,000 monthly allowance', async () => {
      const payload = {
        educationRegNo: 'ENG-2024-8491',
        applicantName: 'ಚೇತನ್ ಕುಮಾರ್',
        qualification: 'GRADUATE',
        passingYear: 2024,
        monthsUnemployed: 8,
        isEmployed: false,
        isPursuingHigherStudies: false,
        isKarnatakaDomicile: true,
        rationCardNumber: 'KA-04-9841284',
      };

      const res = await fetch(`${baseUrl}/api/yuva-nidhi/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.eligibility.educationRegNo, 'ENG-2024-8491');
      assert.strictEqual(body.eligibility.isEligible, true);
      assert.strictEqual(body.eligibility.benefitAmountPerMonth, 3000);
      assert.strictEqual(body.eligibility.rationCardNumber, '*********1284');
      assert.strictEqual(body.eligibility.maxBenefitDurationMonths, 24);
      assert.ok(body.audioBase64.length > 0);
      assert.ok(body.spokenExplanationKn.includes('ಯುವನಿಧಿ'));
    });

    it('POST /api/yuva-nidhi/check evaluates eligible Diploma candidate for ₹1,500 monthly allowance', async () => {
      const payload = {
        educationRegNo: 'DIP-2025-1042',
        applicantName: 'ರಮ್ಯಾ ಎಸ್',
        qualification: 'DIPLOMA',
        passingYear: 2025,
        monthsUnemployed: 7,
        isEmployed: false,
        isPursuingHigherStudies: false,
        isKarnatakaDomicile: true,
      };

      const res = await fetch(`${baseUrl}/api/yuva-nidhi/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.eligibility.qualification, 'DIPLOMA');
      assert.strictEqual(body.eligibility.isEligible, true);
      assert.strictEqual(body.eligibility.benefitAmountPerMonth, 1500);
      assert.ok(body.audioBase64.length > 0);
    });

    it('POST /api/yuva-nidhi/check flags ineligible candidate with < 6 months unemployment or currently employed', async () => {
      const payload = {
        educationRegNo: 'ENG-2026-0012',
        applicantName: 'ರಾಜು',
        qualification: 'GRADUATE',
        passingYear: 2026,
        monthsUnemployed: 2,
        isEmployed: true,
        isPursuingHigherStudies: false,
        isKarnatakaDomicile: true,
      };

      const res = await fetch(`${baseUrl}/api/yuva-nidhi/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.eligibility.isEligible, false);
      assert.strictEqual(body.eligibility.benefitAmountPerMonth, 0);
      assert.ok(body.eligibility.disqualificationReasonsKn.length >= 2);
    });

    it('GET /api/yuva-nidhi/:educationRegNo returns demo candidate record', async () => {
      const res = await fetch(`${baseUrl}/api/yuva-nidhi/ENG-2024-8491`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.demo.educationRegNo, 'ENG-2024-8491');
      assert.strictEqual(body.demo.qualification, 'GRADUATE');
    });

    it('GET /api/yuva-nidhi/:educationRegNo returns 404 for unknown candidate', async () => {
      const res = await fetch(`${baseUrl}/api/yuva-nidhi/UNKNOWN-CANDIDATE-9999`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.code, 'CANDIDATE_NOT_FOUND');
    });
  });

  describe('Karnataka Shakti Scheme Free Bus Travel Endpoints', () => {
    it('POST /api/shakti/pass/apply successfully issues Shakti Smart Pass for eligible woman citizen', async () => {
      const payload = {
        applicantName: 'ಸವಿತಾ ಕುಮಾರಿ',
        gender: 'FEMALE',
        isKarnatakaDomicile: true,
        aadhaarNumber: '582910494821',
        preferredRtc: 'BMTC',
        district: 'Bengaluru Urban',
      };

      const res = await fetch(`${baseUrl}/api/shakti/pass/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.status, 'ok');
      assert.match(body.pass.passNumber, /^SHAKTI-KAR-2026-[A-F0-9]{8}$/);
      assert.strictEqual(body.pass.aadhaarNumber, '********4821');
      assert.strictEqual(body.pass.gender, 'FEMALE');
      assert.strictEqual(body.pass.preferredRtc, 'BMTC');
      assert.ok(body.audioBase64.length > 0);
      assert.ok(body.spokenConfirmationKn.includes('ಶಕ್ತಿ'));
    });

    it('POST /api/shakti/pass/apply rejects non-female applicants with 400', async () => {
      const payload = {
        applicantName: 'ರಮೇಶ್',
        gender: 'MALE',
        isKarnatakaDomicile: true,
        aadhaarNumber: '582910494821',
        preferredRtc: 'KSRTC',
        district: 'Mysuru',
      };

      const res = await fetch(`${baseUrl}/api/shakti/pass/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/shakti/route/check returns zero-ticket eligible for KSRTC Express route', async () => {
      const payload = {
        rtc: 'KSRTC',
        busCategory: 'EXPRESS',
        origin: 'ಬೆಂಗಳೂರು',
        destination: 'ಮೈಸೂರು',
      };

      const res = await fetch(`${baseUrl}/api/shakti/route/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.routeCheck.isZeroTicketEligible, true);
      assert.strictEqual(body.routeCheck.payableFare, 0);
      assert.strictEqual(body.routeCheck.subsidySavings, 120);
      assert.ok(body.audioBase64.length > 0);
      assert.ok(body.spokenExplanationKn.includes('ಉಚಿತ'));
    });

    it('POST /api/shakti/route/check identifies luxury Airavat route as non-eligible', async () => {
      const payload = {
        rtc: 'KSRTC',
        busCategory: 'AIRAVAT',
        origin: 'ಬೆಂಗಳೂರು',
        destination: 'ಮಂಗಳೂರು',
      };

      const res = await fetch(`${baseUrl}/api/shakti/route/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.routeCheck.isZeroTicketEligible, false);
      assert.strictEqual(body.routeCheck.payableFare, 350);
      assert.strictEqual(body.routeCheck.subsidySavings, 0);
      assert.ok(body.audioBase64.length > 0);
    });

    it('GET /api/shakti/pass/:passNumber returns demo pass for known SHAKTI-KAR-2026-B812', async () => {
      const res = await fetch(`${baseUrl}/api/shakti/pass/SHAKTI-KAR-2026-B812`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.pass.passNumber, 'SHAKTI-KAR-2026-B812');
      assert.strictEqual(body.pass.preferredRtc, 'BMTC');
    });

    it('GET /api/shakti/pass/:passNumber returns 404 for unknown pass', async () => {
      const res = await fetch(`${baseUrl}/api/shakti/pass/UNKNOWN-PASS-9999`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.error.code, 'PASS_NOT_FOUND');
    });
  });

  describe('Karnataka Anna Bhagya Foodgrains & Cash DBT Endpoints', () => {
    it('POST /api/annabhagya/calculate calculates 20kg free rice and ₹680 DBT cash for 4-member BPL household', async () => {
      const payload = {
        rationCardNumber: 'RC-KAR-BPL-9182',
        headOfFamilyName: 'ಸವಿತಾ ಕುಮಾರಿ',
        cardType: 'BPL',
        memberCount: 4,
        dbtBankLinked: true,
        district: 'Bengaluru Urban',
      };

      const res = await fetch(`${baseUrl}/api/annabhagya/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.entitlement.isEligible, true);
      assert.strictEqual(body.entitlement.freeRiceKg, 20);
      assert.strictEqual(body.entitlement.dbtCashPerMonth, 680);
      assert.strictEqual(body.entitlement.dbtStatus, 'ACTIVE');
      assert.ok(body.audioBase64.length > 0);
      assert.ok(body.spokenExplanationKn.includes('ಅನ್ನಭಾಗ್ಯ'));
    });

    it('POST /api/annabhagya/calculate evaluates APL household as ineligible with ₹0 cash and 0kg rice', async () => {
      const payload = {
        rationCardNumber: 'RC-KAR-APL-1122',
        headOfFamilyName: 'ಸುರೇಶ್ ಕುಮಾರ್',
        cardType: 'APL',
        memberCount: 3,
        dbtBankLinked: true,
      };

      const res = await fetch(`${baseUrl}/api/annabhagya/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.entitlement.isEligible, false);
      assert.strictEqual(body.entitlement.freeRiceKg, 0);
      assert.strictEqual(body.entitlement.dbtCashPerMonth, 0);
      assert.strictEqual(body.entitlement.dbtStatus, 'NOT_ELIGIBLE');
    });

    it('POST /api/annabhagya/calculate flags ACTION_REQUIRED when dbtBankLinked is false', async () => {
      const payload = {
        rationCardNumber: 'RC-KAR-BPL-7733',
        headOfFamilyName: 'ಮಂಜುಳಾ',
        cardType: 'BPL',
        memberCount: 2,
        dbtBankLinked: false,
      };

      const res = await fetch(`${baseUrl}/api/annabhagya/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.entitlement.dbtStatus, 'ACTION_REQUIRED');
      assert.ok(body.entitlement.dbtStatusKn.includes('NPCI'));
    });

    it('POST /api/annabhagya/calculate rejects invalid memberCount with 400', async () => {
      const payload = {
        rationCardNumber: 'RC-KAR-BPL-7733',
        headOfFamilyName: 'ಮಂಜುಳಾ',
        cardType: 'BPL',
        memberCount: 0,
      };

      const res = await fetch(`${baseUrl}/api/annabhagya/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('GET /api/annabhagya/card/:rcNumber returns demo card for RC-KAR-BPL-8821', async () => {
      const res = await fetch(`${baseUrl}/api/annabhagya/card/RC-KAR-BPL-8821`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.card.cardType, 'BPL');
      assert.strictEqual(body.card.freeRiceKg, 20);
      assert.strictEqual(body.card.dbtCashPerMonth, 680);
    });

    it('GET /api/annabhagya/card/:rcNumber returns 404 for unknown ration card', async () => {
      const res = await fetch(`${baseUrl}/api/annabhagya/card/UNKNOWN-RC-9999`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.error.code, 'CARD_NOT_FOUND');
    });
  });

  describe('Karnataka Bhoomi RTC Pahani Land Records Endpoints', () => {
    it('POST /api/bhoomi/rtc/fetch successfully fetches RTC Pahani record', async () => {
      const payload = {
        district: 'Bengaluru Rural',
        taluk: 'Devanahalli',
        hobli: 'Kasaba',
        village: 'Koramangala',
        surveyNumber: '102',
        hissaNumber: '1',
      };

      const res = await fetch(`${baseUrl}/api/bhoomi/rtc/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.match(body.rtc.rtcNumber, /^BHOOMI-KAR-2026-[A-F0-9]{8}$/);
      assert.strictEqual(body.rtc.surveyNumber, '102');
      assert.strictEqual(body.rtc.mutationStatus, 'APPROVED');
      assert.strictEqual(body.rtc.encumbranceFree, true);
      assert.ok(body.audioBase64.length > 0);
      assert.ok(body.spokenSummaryKn.includes('ಪಹಣಿ'));
    });

    it('POST /api/bhoomi/rtc/fetch rejects invalid Aadhaar format with 400', async () => {
      const payload = {
        district: 'Bengaluru Rural',
        taluk: 'Devanahalli',
        hobli: 'Kasaba',
        village: 'Koramangala',
        surveyNumber: '102',
        ownerAadhaar: '12345', // invalid length
      };

      const res = await fetch(`${baseUrl}/api/bhoomi/rtc/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('GET /api/bhoomi/rtc/:rtcNumber returns demo RTC for BHOOMI-BLR-DEV-2026-S102', async () => {
      const res = await fetch(`${baseUrl}/api/bhoomi/rtc/BHOOMI-BLR-DEV-2026-S102`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.rtc.rtcNumber, 'BHOOMI-BLR-DEV-2026-S102');
      assert.strictEqual(body.rtc.taluk, 'Devanahalli');
      assert.strictEqual(body.rtc.extentAcres, 2);
      assert.strictEqual(body.rtc.extentGuntas, 20);
    });

    it('GET /api/bhoomi/rtc/:rtcNumber returns 404 for unknown RTC number', async () => {
      const res = await fetch(`${baseUrl}/api/bhoomi/rtc/UNKNOWN-BHOOMI-9999`);
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.error.code, 'RTC_NOT_FOUND');
    });

    it('POST /api/bhoomi/rtc/export validates schema and returns masked phone number', async () => {
      const payload = {
        rtcNumber: 'BHOOMI-BLR-DEV-2026-S102',
        citizenPhone: '9845012345',
      };

      const res = await fetch(`${baseUrl}/api/bhoomi/rtc/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.export.rtcNumber, 'BHOOMI-BLR-DEV-2026-S102');
      assert.strictEqual(body.export.citizenPhone, '******2345');
    });

    it('POST /api/bhoomi/rtc/export rejects invalid phone number with 400', async () => {
      const payload = {
        rtcNumber: 'BHOOMI-BLR-DEV-2026-S102',
        citizenPhone: '123', // invalid phone
      };

      const res = await fetch(`${baseUrl}/api/bhoomi/rtc/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('Audio Synthesis LRU Cache & SHA256 Deduplication Endpoints', () => {
    const testAdminKey = 'janvaani_test_secret_key';

    beforeEach(() => {
      process.env.AUDIO_CACHE_ADMIN_KEY = testAdminKey;
    });

    it('GET /api/audio/cache/stats returns current cache statistics', async () => {
      const res = await fetch(`${baseUrl}/api/audio/cache/stats`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('hits' in body.data);
      assert.ok('misses' in body.data);
      assert.ok('size' in body.data);
      assert.ok('maxSize' in body.data);
      assert.ok('totalBytes' in body.data);
      assert.ok('maxTotalBytes' in body.data);
      assert.ok('hitRatio' in body.data);
    });

    it('POST /api/audio/cache/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/audio/cache/clear`, {
        method: 'POST',
      });
      const body = await res.json();

      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/audio/cache/clear clears cache with valid admin key', async () => {
      const res = await fetch(`${baseUrl}/api/audio/cache/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testAdminKey },
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.data.clearedEntries === 'number');
    });
  });

  describe('WhatsApp Webhook Idempotency & Duplicate Message Rejection Endpoints', () => {
    it('GET /api/whatsapp/idempotency/stats returns initial idempotency engine metrics', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/idempotency/stats`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.data.activeKeys === 'number');
      assert.ok(typeof body.data.totalDuplicatesCaught === 'number');
      assert.strictEqual(body.data.windowMs, 600000);
    });

    it('POST /api/whatsapp/message processes first transmission and drops duplicate transmission', async () => {
      const uniqueMsgId = `wamid.HBgLOTE5ODQ1MDEyMzQ1FQIAEhgg${Date.now()}`;
      const payload = {
        senderId: '9845012345',
        messageId: uniqueMsgId,
        type: 'text',
        text: 'ನನ್ನ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD001 ರ ಸ್ಥಿತಿ ತಿಳಿಸಿ',
      };

      // 1. First send: processes normally
      const res1 = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body1 = await res1.json();
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(body1.status, 'ok');

      // 2. Immediate second send (webhook retry): detected as duplicate and ignored
      const res2 = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body2 = await res2.json();
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(body2.status, 'duplicate_ignored');
      assert.strictEqual(body2.feature, 'idempotency_guard');
      assert.strictEqual(body2.messageId, uniqueMsgId);
      assert.strictEqual(body2.duplicateCount, 2);
      assert.strictEqual(body2.senderPhone, '9845012345');
    });
  });

  describe('Indic Unicode Grapheme Normalization & Kanglish Cleaning Endpoints', () => {
    it('GET /api/indic/health returns status ok', async () => {
      const res = await fetch(`${baseUrl}/api/indic/health`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.service, 'indic-normalizer');
    });

    it('POST /api/indic/normalize transliterates Kannada numerals and strips zero-width characters', async () => {
      // String with Kannada numerals (೦೦೧), zero-width space (\u200B), and extra whitespace
      const input = 'ಅರ್ಜಿ\u200B   ಸಂಖ್ಯೆ   RD೦೦೧   ';
      const res = await fetch(`${baseUrl}/api/indic/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.data.normalized, 'ಅರ್ಜಿ ಸಂಖ್ಯೆ RD001');
      assert.strictEqual(body.data.containsKannadaScript, true);
      assert.strictEqual(body.data.containsKannadaDigits, true);
    });

    it('POST /api/indic/normalize rejects missing or non-string text with 400', async () => {
      const res = await fetch(`${baseUrl}/api/indic/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 12345 }),
      });
      const body = await res.json();

      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'MISSING_TEXT');
    });

    it('POST /api/whatsapp/message with Kannada numerals RD೦೦೧ resolves to status check for RD001', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          text: 'ನನ್ನ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD೦೦೧ ರ ಸ್ಥಿತಿ ತಿಳಿಸಿ',
        }),
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.feature, 'audio_status_bell');
      assert.strictEqual(body.statusRecord.ackNumber, 'RD001');
    });
  });

  describe('Centralized Structured Civic Audit Logger Middleware Endpoints', () => {
    const testAuditKey = 'janvaani_test_audit_secret_key';

    beforeEach(() => {
      process.env.AUDIT_SECRET_KEY = testAuditKey;
    });

    it('GET /api/audit/logs rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/audit/logs`);
      const body = await res.json();

      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('GET /api/audit/logs returns recorded civic request entries with masked phone numbers', async () => {
      // Send a request with a citizen phone to verify logging and masking
      await fetch(`${baseUrl}/api/indic/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'ನಮಸ್ಕಾರ', citizenPhone: '9845012345' }),
      });

      const res = await fetch(`${baseUrl}/api/audit/logs`, {
        headers: { 'x-audit-secret': testAuditKey },
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.count === 'number');
      assert.ok(Array.isArray(body.logs));
      const found = body.logs.find((l: any) => l.path === '/api/indic/normalize');
      if (found && found.callerPhone) {
        assert.strictEqual(found.callerPhone, '******2345');
      }
    });

    it('POST /api/audit/clear rejects unauthorized requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/audit/clear`, {
        method: 'POST',
      });
      const body = await res.json();

      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/audit/clear clears buffer with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/audit/clear`, {
        method: 'POST',
        headers: { 'x-audit-secret': testAuditKey },
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.cleared === 'number');
    });
  });

  describe('Sliding-Window IP Rate Limiter Middleware Endpoints', () => {
    const testAdminKey = 'janvaani_test_ratelimit_secret_key';

    beforeEach(() => {
      process.env.RATE_LIMIT_ADMIN_KEY = testAdminKey;
    });

    it('GET /api/rate-limit/stats returns active rate limiter telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/rate-limit/stats`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('trackedIps' in body.data);
      assert.strictEqual(body.data.windowMs, 60000);
      assert.strictEqual(body.data.maxRequests, 500);
    });

    it('POST /api/rate-limit/reset rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/rate-limit/reset`, {
        method: 'POST',
      });
      const body = await res.json();

      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/rate-limit/reset resets window with valid admin key', async () => {
      const res = await fetch(`${baseUrl}/api/rate-limit/reset`, {
        method: 'POST',
        headers: { 'x-admin-key': testAdminKey },
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.cleared === 'number');
    });
  });

  describe('Request Correlation ID & Distributed Tracing Endpoints', () => {
    const testTracingKey = 'janvaani_test_tracing_key';

    beforeEach(() => {
      process.env.TRACING_ADMIN_KEY = testTracingKey;
    });

    it('sets X-Correlation-ID response header automatically on requests', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.has('x-correlation-id'));
      const crid = res.headers.get('x-correlation-id');
      assert.ok(crid?.startsWith('crid_'));
    });

    it('propagates valid client-supplied X-Correlation-ID', async () => {
      const customId = 'client-civic-req-12345';
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { 'x-correlation-id': customId },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-correlation-id'), customId);
    });

    it('sanitizes overlong or malicious client-supplied X-Correlation-ID', async () => {
      const maliciousId = 'invalid#id!with*bad*chars-'.repeat(10);
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { 'x-correlation-id': maliciousId },
      });
      assert.strictEqual(res.status, 200);
      const resId = res.headers.get('x-correlation-id');
      assert.notStrictEqual(resId, maliciousId);
      assert.ok(resId?.startsWith('crid_'));
    });

    it('GET /api/tracing/stats returns active trace spans statistics', async () => {
      const res = await fetch(`${baseUrl}/api/tracing/stats`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('totalRecordedTraces' in body.data);
      assert.strictEqual(body.data.maxCapacity, 500);
    });

    it('GET /api/tracing/trace/:id rejects unauthorized requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/tracing/trace/some-trace-id`);
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/tracing/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/tracing/clear`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/tracing/clear resets spans with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/tracing/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testTracingKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('API Circuit Breaker Engine Endpoints', () => {
    const testCircuitKey = 'janvaani_test_circuit_key';

    beforeEach(() => {
      process.env.CIRCUIT_BREAKER_ADMIN_KEY = testCircuitKey;
    });

    it('GET /api/circuit-breaker/status returns initial circuit states', async () => {
      const res = await fetch(`${baseUrl}/api/circuit-breaker/status`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.data === 'object');
    });

    it('POST /api/circuit-breaker/trigger-mock rejects invalid service identifiers', async () => {
      const res = await fetch(`${baseUrl}/api/circuit-breaker/trigger-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'bad*service!name/injection' }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_SERVICE_NAME');
    });

    it('POST /api/circuit-breaker/trigger-mock records failure and increments state', async () => {
      const res = await fetch(`${baseUrl}/api/circuit-breaker/trigger-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'sarvam-ai' }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.service, 'sarvam-ai');
    });

    it('POST /api/circuit-breaker/reset rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/circuit-breaker/reset`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/circuit-breaker/reset resets breakers with valid admin key', async () => {
      const res = await fetch(`${baseUrl}/api/circuit-breaker/reset`, {
        method: 'POST',
        headers: { 'x-admin-key': testCircuitKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('API Payload Size Guard Middleware Endpoints', () => {
    const testPayloadKey = 'janvaani_test_payload_guard_key';

    beforeEach(() => {
      process.env.PAYLOAD_GUARD_ADMIN_KEY = testPayloadKey;
      delete process.env.PAYLOAD_GUARD_MAX_BYTES;
    });

    it('GET /api/payload-guard/stats returns active guard telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/payload-guard/stats`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('totalScannedRequests' in body.data);
      assert.ok('maxByteLimit' in body.data);
      assert.strictEqual(body.data.maxBufferSize, 100);
    });

    it('rejects malformed non-numeric Content-Length header with 400', async () => {
      const res = await fetch(`${baseUrl}/api/payload-guard/stats`, {
        headers: { 'x-content-length': 'not-a-number' },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_CONTENT_LENGTH');
    });

    it('rejects payload exceeding max byte limit with 413', async () => {
      process.env.PAYLOAD_GUARD_MAX_BYTES = '200';
      const largePayload = JSON.stringify({ message: 'x'.repeat(400) });

      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: largePayload,
      });
      const body = await res.json();

      assert.strictEqual(res.status, 413);
      assert.strictEqual(body.error.code, 'PAYLOAD_TOO_LARGE');
    });

    it('POST /api/payload-guard/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/payload-guard/clear`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/payload-guard/clear resets buffer with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/payload-guard/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testPayloadKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('Connection Drain & Active Transaction Manager Endpoints', () => {
    const testDrainKey = 'janvaani_test_drain_key';

    beforeEach(() => {
      process.env.DRAIN_ADMIN_KEY = testDrainKey;
    });

    afterEach(async () => {
      await fetch(`${baseUrl}/api/drain/cancel`, {
        method: 'POST',
        headers: { 'x-admin-key': testDrainKey },
      });
    });

    it('GET /api/drain/status returns active connection metrics', async () => {
      const res = await fetch(`${baseUrl}/api/drain/status`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.data.isDraining, false);
      assert.ok(typeof body.data.inFlightCount === 'number');
    });

    it('POST /api/drain/initiate rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/drain/initiate`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/drain/initiate enables drain mode with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/drain/initiate`, {
        method: 'POST',
        headers: { 'x-admin-key': testDrainKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');

      // Verify standard civic route returns 503 during drain mode without PII
      const civicRes = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test' }),
      });
      const civicBody = await civicRes.json();
      assert.strictEqual(civicRes.status, 503);
      assert.strictEqual(civicBody.error.code, 'SERVER_DRAINING');
      assert.strictEqual('callerPhone' in civicBody, false);

      // Cancel drain mode with admin secret
      const cancelRes = await fetch(`${baseUrl}/api/drain/cancel`, {
        method: 'POST',
        headers: { 'x-admin-key': testDrainKey },
      });
      const cancelBody = await cancelRes.json();
      assert.strictEqual(cancelRes.status, 200);
      assert.strictEqual(cancelBody.status, 'ok');
    });
  });

  describe('HTTP Response ETag & Conditional Cache Endpoints', () => {
    const testETagKey = 'janvaani_test_etag_secret';

    beforeEach(() => {
      process.env.ETAG_ADMIN_KEY = testETagKey;
    });

    it('GET /api/cache/etag/stats returns initial cache statistics', async () => {
      const res = await fetch(`${baseUrl}/api/cache/etag/stats`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('cachedEntriesCount' in body.data);
      assert.strictEqual(body.data.maxCapacity, 200);
    });

    it('attaches ETag header on successful GET response and responds 304 for matching If-None-Match', async () => {
      const firstRes = await fetch(`${baseUrl}/api/services?query=ration`);
      assert.strictEqual(firstRes.status, 200);
      assert.ok(firstRes.headers.has('etag'));
      const etag = firstRes.headers.get('etag');
      assert.ok(etag?.startsWith('W/"'));

      // Conditional GET with matching If-None-Match header
      const secondRes = await fetch(`${baseUrl}/api/services?query=ration`, {
        headers: { 'if-none-match': etag! },
      });
      assert.strictEqual(secondRes.status, 304);
    });

    it('POST /api/cache/etag/flush rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/cache/etag/flush`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/cache/etag/flush clears cache with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/cache/etag/flush`, {
        method: 'POST',
        headers: { 'x-admin-key': testETagKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('Civic Request Schema Sanitization & Threat Defense Endpoints', () => {
    const testSanitizerKey = 'janvaani_test_sanitizer_key';

    beforeEach(() => {
      process.env.SANITIZER_ADMIN_KEY = testSanitizerKey;
    });

    it('GET /api/security/sanitizer/stats returns initial telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/security/sanitizer/stats`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('totalInspectedRequests' in body.data);
      assert.strictEqual(body.data.maxLogCapacity, 100);
    });

    it('POST /api/security/sanitizer/test strips multiple prototype pollution keys without stateful regex skipping', async () => {
      const payload = {
        name: 'Basavaraj',
        __proto__: { admin: true },
        constructor: 'malicious',
        prototype: 'injection',
        nested: {
          constructor: 'nested-pollute',
          valid: 'Bangalore',
        },
      };

      const res = await fetch(`${baseUrl}/api/security/sanitizer/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(Object.prototype.hasOwnProperty.call(body.sanitizedBody, 'constructor'), false);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(body.sanitizedBody, 'prototype'), false);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(body.sanitizedBody.nested, 'constructor'), false);
      assert.strictEqual(body.sanitizedBody.nested.valid, 'Bangalore');
      assert.strictEqual(body.sanitizedBody.name, 'Basavaraj');
    });

    it('rejects malicious payload in strict mode with 400 and zero PII', async () => {
      const res = await fetch(`${baseUrl}/api/security/sanitizer/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-strict-sanitization': 'true',
        },
        body: JSON.stringify({
          constructor: 'pollute',
          citizenPhone: '9845012345',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'MALICIOUS_INPUT_DETECTED');
      assert.strictEqual('citizenContact' in body, false);
    });

    it('POST /api/security/sanitizer/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/security/sanitizer/clear`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/security/sanitizer/clear flushes audit log with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/security/sanitizer/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testSanitizerKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('Async Background Job Queue & Task Telemetry Endpoints', () => {
    it('GET /api/jobs/stats returns initial job queue telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/stats`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('totalJobs' in body.data);
    });

    it('POST /api/jobs/submit queues a new background processing task', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sarvam_voice_synthesis',
          metadata: { scheme: 'gruha_jyothi' },
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 202);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.data.id.startsWith('job_'));
      assert.strictEqual(body.data.type, 'sarvam_voice_synthesis');
    });

    it('POST /api/jobs/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/clear`, {
        method: 'POST',
      });
      assert.strictEqual(res.status, 401);
    });

    it('POST /api/jobs/clear flushes queue with admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': 'janvaani_jobs_admin_secret' },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });
});





