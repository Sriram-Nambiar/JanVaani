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
    it('GET /api/audio/cache/stats returns current cache statistics', async () => {
      const res = await fetch(`${baseUrl}/api/audio/cache/stats`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('hits' in body.data);
      assert.ok('misses' in body.data);
      assert.ok('size' in body.data);
      assert.ok('maxSize' in body.data);
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
        headers: { 'x-admin-key': 'janvaani_demo_secret' },
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.data.clearedEntries === 'number');
    });
  });
});

