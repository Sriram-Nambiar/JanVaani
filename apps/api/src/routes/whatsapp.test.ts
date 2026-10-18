import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import type { Server } from 'node:http';
import { app } from '../app.js';
import { sarvamService, SarvamService } from '../services/sarvam.js';
import { schemesService } from '../services/schemes.js';
import { trackerService, maskApplicantName, maskId } from '../services/tracker.js';

describe('JanVaani WhatsApp & Voice Copilot Engine Test Suite', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    if (!process.env.PGPASSWORD) {
      process.env.PGPASSWORD = 'mysecretpassword';
    }

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
    it('operates in mock mode when no live API key is provided', () => {
      const mockService = new SarvamService('');
      assert.strictEqual(mockService.isMockMode(), true);
    });

    it('transcribes Kannada voice input in simulated/mock mode', async () => {
      const mockService = new SarvamService('');
      const result = await mockService.speechToText({}, 'gruha_lakshmi_apply');
      assert.strictEqual(result.languageCode, 'kn-IN');
      assert.ok(result.transcript.includes('ಗೃಹಲಕ್ಷ್ಮಿ'));
      assert.strictEqual(result.isMock, true);
    });

    it('synthesizes Kannada speech to valid audio base64 in simulated/mock mode', async () => {
      const mockService = new SarvamService('');
      const result = await mockService.textToSpeech('ನಮಸ್ಕಾರ, ಜನವಾಣಿಗೆ ಸ್ವಾಗತ');
      assert.ok(result.audioBase64.length > 0);
      assert.strictEqual(result.format, 'wav');
      assert.strictEqual(result.isMock, true);
    });

    it('supports conversational chat completions', async () => {
      const res = await sarvamService.chatCompletion([
        { role: 'user', content: 'ನಮಸ್ಕಾರ' }
      ]);
      assert.ok(res.reply.length > 0);
      assert.strictEqual(typeof res.isMock, 'boolean');
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

    it('routes general conversational text queries to Sarvam-105B chat', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: '+919876543210',
          type: 'text',
          text: 'ನಮಸ್ಕಾರ, ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡಿ',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.feature, 'sarvam_chat');
      assert.ok(data.messageKn.length > 0);
      assert.ok(data.audioBase64.length > 0);
    });

    it('GET /api/whatsapp/mode returns Sarvam engine execution mode', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/mode`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(typeof data.isMock, 'boolean');
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

    it('POST /api/whatsapp/schemes/anna-bhagya/calculate-dbt calculates food grain and cash entitlement', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/anna-bhagya/calculate-dbt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rationCardNumber: 'RC8829104928',
          familyMembersCount: 4,
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.schemeId, 'anna_bhagya');
      assert.strictEqual(data.monthlyBenefits.totalEntitlementKg, 40);
      assert.strictEqual(data.monthlyBenefits.freeRiceKg, 20);
      assert.strictEqual(data.monthlyBenefits.dbtCashInLieuKg, 20);
      assert.strictEqual(data.monthlyBenefits.dbtCashInLieuInr, 680);
    });

    it('POST /api/whatsapp/schemes/anna-bhagya/calculate-dbt rejects invalid, fractional, or unbounded payload with 400', async () => {
      const res1 = await fetch(`${baseUrl}/api/whatsapp/schemes/anna-bhagya/calculate-dbt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rationCardNumber: 'RC8829104928',
          familyMembersCount: 0,
        }),
      });
      assert.strictEqual(res1.status, 400);

      const res2 = await fetch(`${baseUrl}/api/whatsapp/schemes/anna-bhagya/calculate-dbt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rationCardNumber: 'RC8829104928',
          familyMembersCount: 3.5,
        }),
      });
      assert.strictEqual(res2.status, 400);

      const res3 = await fetch(`${baseUrl}/api/whatsapp/schemes/anna-bhagya/calculate-dbt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rationCardNumber: 'RC8829104928',
          familyMembersCount: 100,
        }),
      });
      assert.strictEqual(res3.status, 400);
    });

    it('POST /api/whatsapp/schemes/yuva-nidhi/verify-eligibility verifies degree holder allowance', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/yuva-nidhi/verify-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'ಸುರೇಶ್ (Suresh)',
          qualificationType: 'DEGREE',
          graduationYear: 2024,
          mobileNumber: '9876543210',
          aadhaarNumber: '443322110099',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.schemeId, 'yuva_nidhi');
      assert.strictEqual(data.isEligible, true);
      assert.strictEqual(data.monthlyStipendInr, 3000);
    });

    it('POST /api/whatsapp/schemes/yuva-nidhi/verify-eligibility verifies diploma holder allowance', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/yuva-nidhi/verify-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'ರಮೇಶ್ (Ramesh)',
          qualificationType: 'DIPLOMA',
          graduationYear: 2023,
          mobileNumber: '9876543211',
          aadhaarNumber: '443322110088',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.isEligible, true);
      assert.strictEqual(data.monthlyStipendInr, 1500);
    });

    it('POST /api/whatsapp/schemes/yuva-nidhi/verify-eligibility rejects missing payload with 400', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/yuva-nidhi/verify-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qualificationType: 'DEGREE',
        }),
      });

      assert.strictEqual(res.status, 400);

      // Rejects missing applicantName
      const resName = await fetch(`${baseUrl}/api/whatsapp/schemes/yuva-nidhi/verify-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qualificationType: 'DEGREE',
          graduationYear: 2024,
          mobileNumber: '9876543210',
          aadhaarNumber: '443322110099',
        }),
      });
      assert.strictEqual(resName.status, 400);

      // Rejects invalid qualificationType
      const resQual = await fetch(`${baseUrl}/api/whatsapp/schemes/yuva-nidhi/verify-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'Suresh',
          qualificationType: 'DOCTORATE',
          graduationYear: 2024,
          mobileNumber: '9876543210',
          aadhaarNumber: '443322110099',
        }),
      });
      assert.strictEqual(resQual.status, 400);

      // Rejects non-numeric or out-of-bound graduationYear
      const resYear = await fetch(`${baseUrl}/api/whatsapp/schemes/yuva-nidhi/verify-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'Suresh',
          qualificationType: 'DEGREE',
          graduationYear: 'invalid_year',
          mobileNumber: '9876543210',
          aadhaarNumber: '443322110099',
        }),
      });
      assert.strictEqual(resYear.status, 400);
    });

    it('POST /api/whatsapp/schemes/ganga-kalyana/calculate-subsidy evaluates small farmer borewell subsidy', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/ganga-kalyana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'ಮಲ್ಲೇಶ್ ಗೌಡ',
          casteCategory: '2A',
          landAcres: 2.5,
          surveyNumber: '104/2B',
          mobileNumber: '9845012399',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.schemeId, 'ganga_kalyana');
      assert.strictEqual(data.isEligible, true);
      assert.strictEqual(data.subsidyAmountInr, 350000);
    });

    it('POST /api/whatsapp/schemes/ganga-kalyana/calculate-subsidy rejects missing required fields or invalid acreage with 400', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/ganga-kalyana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casteCategory: '2A',
        }),
      });

      assert.strictEqual(res.status, 400);

      const resAcres = await fetch(`${baseUrl}/api/whatsapp/schemes/ganga-kalyana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'ಮಲ್ಲೇಶ್ ಗೌಡ',
          casteCategory: '2A',
          landAcres: 12.0, // Exceeds 5.0 acres limit
          surveyNumber: '104/2B',
          mobileNumber: '9845012399',
        }),
      });

      assert.strictEqual(resAcres.status, 400);
    });

    it('POST /api/whatsapp/schemes/raita-vidya-nidhi/calculate-scholarship calculates student scholarship', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/raita-vidya-nidhi/calculate-scholarship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'ಕಾವ್ಯ (Kavya)',
          gender: 'FEMALE',
          fruitsId: 'FRUITS-90218',
          courseLevel: 'PUC',
          collegeName: 'Government PU College, Mandya',
          aadhaarNumber: '443322119900',
          mobileNumber: '9845012399',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.schemeId, 'raita_vidya_nidhi');
      assert.strictEqual(data.isEligible, true);
      assert.strictEqual(data.annualScholarshipInr, 3000);

      // Male applicant receives standard PUC rate of 2500
      const resMale = await fetch(`${baseUrl}/api/whatsapp/schemes/raita-vidya-nidhi/calculate-scholarship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'ಮಂಜುನಾಥ (Manjunath)',
          gender: 'MALE',
          fruitsId: 'FRUITS-90218',
          courseLevel: 'PUC',
          collegeName: 'Government PU College, Mandya',
          aadhaarNumber: '443322119911',
          mobileNumber: '9845012399',
        }),
      });
      assert.strictEqual(resMale.status, 200);
      const dataMale = await resMale.json();
      assert.strictEqual(dataMale.annualScholarshipInr, 2500);
    });

    it('POST /api/whatsapp/schemes/raita-vidya-nidhi/calculate-scholarship rejects missing fields with 400', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/raita-vidya-nidhi/calculate-scholarship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseLevel: 'PUC',
        }),
      });

      assert.strictEqual(res.status, 400);

      // Rejects invalid course level
      const resCourse = await fetch(`${baseUrl}/api/whatsapp/schemes/raita-vidya-nidhi/calculate-scholarship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Kavya',
          gender: 'FEMALE',
          fruitsId: 'FRUITS-90218',
          courseLevel: 'ASTRONOMY',
          collegeName: 'Govt College',
          aadhaarNumber: '443322119900',
          mobileNumber: '9845012399',
        }),
      });
      assert.strictEqual(resCourse.status, 400);
    });

    it('POST /api/whatsapp/schemes/swavalambana/calculate-subsidy calculates micro-enterprise capital subsidy', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/swavalambana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'ಪ್ರಕಾಶ್ ಕುಮಾರ್ (Prakash Kumar)',
          enterpriseType: 'Retail Grocery Store',
          projectCostInr: 200000,
          casteCategory: '2A',
          bankIfsc: 'SBIN0040123',
          aadhaarNumber: '443322119955',
          mobileNumber: '9845012399',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.schemeId, 'swavalambana');
      assert.strictEqual(data.isEligible, true);
      assert.strictEqual(data.capitalSubsidyInr, 100000);

      // Calculates 50% for smaller project below cap (e.g. 100,000 cost yields 50,000 subsidy)
      const resPartial = await fetch(`${baseUrl}/api/whatsapp/schemes/swavalambana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'Prakash Kumar',
          enterpriseType: 'Tailoring Unit',
          projectCostInr: 100000,
          casteCategory: '2A',
          bankIfsc: 'SBIN0040123',
          aadhaarNumber: '443322119955',
          mobileNumber: '9845012399',
        }),
      });
      assert.strictEqual(resPartial.status, 200);
      const dataPartial = await resPartial.json();
      assert.strictEqual(dataPartial.capitalSubsidyInr, 50000);

      // Supports string-coerced numeric projectCostInr
      const resString = await fetch(`${baseUrl}/api/whatsapp/schemes/swavalambana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'Prakash Kumar',
          enterpriseType: 'Carpentry Workshop',
          projectCostInr: '200000',
          casteCategory: 'CAT-1',
          bankIfsc: 'SBIN0040123',
          aadhaarNumber: '443322119955',
          mobileNumber: '9845012399',
        }),
      });
      assert.strictEqual(resString.status, 200);
      const dataString = await resString.json();
      assert.strictEqual(dataString.capitalSubsidyInr, 100000);
    });

    it('POST /api/whatsapp/schemes/swavalambana/calculate-subsidy rejects missing fields or invalid costs with 400', async () => {
      const res = await fetch(`${baseUrl}/api/whatsapp/schemes/swavalambana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseType: 'Retail Grocery Store',
        }),
      });

      assert.strictEqual(res.status, 400);

      // Rejects project cost > 500000
      const resCost = await fetch(`${baseUrl}/api/whatsapp/schemes/swavalambana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'Prakash Kumar',
          enterpriseType: 'Large Factory',
          projectCostInr: 10000000,
          casteCategory: '2A',
          bankIfsc: 'SBIN0040123',
          aadhaarNumber: '443322119955',
          mobileNumber: '9845012399',
        }),
      });
      assert.strictEqual(resCost.status, 400);

      // Rejects invalid caste category
      const resCaste = await fetch(`${baseUrl}/api/whatsapp/schemes/swavalambana/calculate-subsidy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'Prakash Kumar',
          enterpriseType: 'Retail Grocery Store',
          projectCostInr: 100000,
          casteCategory: 'INVALID_CATEGORY',
          bankIfsc: 'SBIN0040123',
          aadhaarNumber: '443322119955',
          mobileNumber: '9845012399',
        }),
      });
      assert.strictEqual(resCaste.status, 400);
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
    const testGrievanceKey = 'test_grievance_admin_secret_5544';
    beforeEach(() => {
      process.env.GRIEVANCE_ADMIN_KEY = testGrievanceKey;
    });

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

    it('GET /api/whatsapp/grievance/raw-export/:docketNumber secures export with admin auth and masked PII', async () => {
      // First submit a grievance to persist it
      const submitRes = await fetch(`${baseUrl}/api/whatsapp/grievance/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: 'ರಮೇಶ್ ಗೌಡ',
          phone: '9845099887',
          district: 'Mandya',
          department: 'REVENUE_NADAKACHERI',
          grievanceCategory: 'SERVICE_DELAY',
          description: 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರಕ್ಕಾಗಿ ೧೫ ದಿನಗಳ ಹಿಂದೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದು ಇನ್ನೂ ಬಂದಿಲ್ಲ.',
        }),
      });
      assert.strictEqual(submitRes.status, 201);
      const submitBody = await submitRes.json();
      const docketNum = submitBody.docketNumber;

      // Unauthorized request rejected with 401
      const unauthRes = await fetch(`${baseUrl}/api/whatsapp/grievance/raw-export/${docketNum}`);
      assert.strictEqual(unauthRes.status, 401);

      // Authorized request succeeds with masked PII
      const exportRes = await fetch(`${baseUrl}/api/whatsapp/grievance/raw-export/${docketNum}`, {
        headers: { 'x-admin-key': testGrievanceKey },
      });
      assert.strictEqual(exportRes.status, 200);
      const exportBody = await exportRes.json();
      assert.strictEqual(exportBody.success, true);
      assert.strictEqual(exportBody.docketNumber, docketNum);
      assert.ok(exportBody.phone.includes('*'));
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

    it('POST /api/audio/cache/store-persistent and GET /api/audio/cache/get-persistent cache and retrieve audio', async () => {
      const testText = 'ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಗ್ಯಾರಂಟಿ ಯೋಜನೆಗಳು';

      // Unauthorized requests rejected with 401
      const unauthStore = await fetch(`${baseUrl}/api/audio/cache/store-persistent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          speaker: 'meera',
          result: {
            audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
            format: 'wav',
            languageCode: 'kn-IN',
            isMock: true,
          },
        }),
      });
      assert.strictEqual(unauthStore.status, 401);

      const unauthGet = await fetch(`${baseUrl}/api/audio/cache/get-persistent?text=${encodeURIComponent(testText)}&speaker=meera`);
      assert.strictEqual(unauthGet.status, 401);

      // Authorized store succeeds
      const storeRes = await fetch(`${baseUrl}/api/audio/cache/store-persistent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testAdminKey,
        },
        body: JSON.stringify({
          text: testText,
          speaker: 'meera',
          result: {
            audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
            format: 'wav',
            languageCode: 'kn-IN',
            isMock: true,
          },
        }),
      });
      assert.strictEqual(storeRes.status, 200);
      const storeBody = await storeRes.json();
      assert.strictEqual(storeBody.status, 'ok');

      // Authorized get succeeds
      const getRes = await fetch(`${baseUrl}/api/audio/cache/get-persistent?text=${encodeURIComponent(testText)}&speaker=meera`, {
        headers: { 'x-admin-key': testAdminKey },
      });
      assert.strictEqual(getRes.status, 200);
      const getBody = await getRes.json();
      assert.strictEqual(getBody.status, 'ok');
      assert.strictEqual(getBody.data.format, 'wav');
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
    const testJobsKey = 'janvaani_test_jobs_secret_key';

    beforeEach(() => {
      process.env.JOB_QUEUE_ADMIN_KEY = testJobsKey;
    });

    it('GET /api/jobs/stats returns initial job queue telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/stats`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok('totalJobs' in body.data);
      assert.strictEqual(body.data.maxCapacity, 200);
    });

    it('POST /api/jobs/submit rejects invalid job types with 400', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'illegal*job!type/injection' }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_JOB_TYPE');
    });

    it('POST /api/jobs/submit queues a new background processing task without PII reflection', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sarvam_voice_synthesis',
          citizenPhone: '9845012345',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 202);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.data.id.startsWith('job_'));
      assert.strictEqual(body.data.type, 'sarvam_voice_synthesis');
      assert.strictEqual('citizenContact' in body.data, false);
    });

    it('GET /api/jobs/status/:id returns 404 for unknown job ID without PII', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/status/non-existent-job-1234`);
      const body = await res.json();
      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.error.code, 'JOB_NOT_FOUND');
      assert.strictEqual('callerPhone' in body, false);
    });

    it('POST /api/jobs/submit-persistent and GET /api/jobs/persistent/:id persist job telemetry', async () => {
      const submitRes = await fetch(`${baseUrl}/api/jobs/submit-persistent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'document_ocr',
          payload: { documentType: 'ration_card' },
        }),
      });
      assert.strictEqual(submitRes.status, 202);
      const submitBody = await submitRes.json();
      assert.strictEqual(submitBody.status, 'ok');
      const jobId = submitBody.data.id;

      const getRes = await fetch(`${baseUrl}/api/jobs/persistent/${jobId}`);
      assert.strictEqual(getRes.status, 200);
      const getBody = await getRes.json();
      assert.strictEqual(getBody.data.id, jobId);
      assert.strictEqual(getBody.data.type, 'document_ocr');

      // Unauthorized raw-query rejected with 401
      const unauthRaw = await fetch(`${baseUrl}/api/jobs/raw-query/${jobId}`);
      assert.strictEqual(unauthRaw.status, 401);

      // Authorized raw-query returns DB record
      const rawRes = await fetch(`${baseUrl}/api/jobs/raw-query/${jobId}`, {
        headers: { 'x-admin-key': testJobsKey },
      });
      assert.strictEqual(rawRes.status, 200);
      const rawBody = await rawRes.json();
      assert.strictEqual(rawBody.success, true);
    });

    it('POST /api/jobs/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/clear`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/jobs/clear flushes queue with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testJobsKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('Deep Health Aggregator & Dependency Readiness Endpoints', () => {
    const testReadinessKey = 'janvaani_test_readiness_secret_key';

    beforeEach(() => {
      process.env.READINESS_ADMIN_KEY = testReadinessKey;
    });

    it('GET /api/readiness returns 200 and healthy subsystems when all dependencies are ready', async () => {
      const res = await fetch(`${baseUrl}/api/readiness`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ready');
      assert.strictEqual(body.subsystems.drainMode, 'HEALTHY');
      assert.ok(body.timestamp);
    });

    it('GET /api/readiness/history returns telemetry probe stats', async () => {
      const res = await fetch(`${baseUrl}/api/readiness/history`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.data.totalProbesRecorded >= 1);
    });

    it('POST /api/readiness/simulate-outage rejects unauthorized caller with 401', async () => {
      const res = await fetch(`${baseUrl}/api/readiness/simulate-outage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsystem: 'database' }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/readiness/simulate-outage rejects invalid subsystem with 400', async () => {
      const res = await fetch(`${baseUrl}/api/readiness/simulate-outage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testReadinessKey,
        },
        body: JSON.stringify({ subsystem: 'invalid_untrusted_service' }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_SUBSYSTEM');
    });

    it('POST /api/readiness/simulate-outage triggers 503 without PII reflection on subsequent probes', async () => {
      const outageRes = await fetch(`${baseUrl}/api/readiness/simulate-outage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testReadinessKey,
        },
        body: JSON.stringify({ subsystem: 'bhoomi_kiosk' }),
      });
      assert.strictEqual(outageRes.status, 200);

      const probeRes = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const probeBody = await probeRes.json();
      assert.strictEqual(probeRes.status, 503);
      assert.strictEqual(probeBody.error.code, 'SYSTEM_NOT_READY');
      assert.strictEqual(probeBody.subsystems.bhoomi_kiosk, 'FAILED');
      assert.strictEqual('callerContact' in probeBody, false);
      assert.strictEqual('citizenPhone' in probeBody, false);
    });

    it('POST /api/readiness/reset clears simulated outages and restores healthy status', async () => {
      const resetRes = await fetch(`${baseUrl}/api/readiness/reset`, {
        method: 'POST',
        headers: { 'x-admin-key': testReadinessKey },
      });
      assert.strictEqual(resetRes.status, 200);

      const probeRes = await fetch(`${baseUrl}/api/readiness`);
      const probeBody = await probeRes.json();
      assert.strictEqual(probeRes.status, 200);
      assert.strictEqual(probeBody.status, 'ready');
    });

    it('GET /api/readiness/raw-probe/:subsystem returns records for scheme', async () => {
      // Unauthorized request rejected with 401
      const unauthRes = await fetch(`${baseUrl}/api/readiness/raw-probe/gruha_lakshmi`);
      assert.strictEqual(unauthRes.status, 401);

      // Authorized request succeeds
      const res = await fetch(`${baseUrl}/api/readiness/raw-probe/gruha_lakshmi`, {
        headers: { 'x-admin-key': testReadinessKey },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.subsystem, 'gruha_lakshmi');
    });
  });

  describe('Distributed Lock Manager & Mutual Exclusion Endpoints', () => {
    const testLocksKey = 'janvaani_test_locks_secret_key';

    beforeEach(() => {
      process.env.LOCKS_ADMIN_KEY = testLocksKey;
    });

    it('GET /api/locks/status returns initial lock telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/locks/status`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(typeof body.data.activeLocksCount, 'number');
    });

    it('POST /api/locks/acquire rejects invalid resource format with 400', async () => {
      const res = await fetch(`${baseUrl}/api/locks/acquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'bad/key/path/with/slashes',
          ownerId: 'worker_node_a',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_RESOURCE');
    });

    it('POST /api/locks/acquire rejects invalid TTL with 400', async () => {
      const res = await fetch(`${baseUrl}/api/locks/acquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'ration_claim_card_1234',
          ownerId: 'worker_node_a',
          ttlMs: 999999999,
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_TTL');
    });

    it('POST /api/locks/acquire grants lock lease on available resource', async () => {
      const res = await fetch(`${baseUrl}/api/locks/acquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'ration_claim_card_1234',
          ownerId: 'worker_node_a',
          ttlMs: 5000,
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.data.resource, 'ration_claim_card_1234');
    });

    it('POST /api/locks/acquire rejects conflicting lock request with 409 and zero PII reflection', async () => {
      const res = await fetch(`${baseUrl}/api/locks/acquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'ration_claim_card_1234',
          ownerId: 'worker_node_b',
          citizenPhone: '9845012345',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 409);
      assert.strictEqual(body.error.code, 'LOCK_ACQUISITION_FAILED');
      assert.strictEqual('callerPhone' in body, false);
      assert.strictEqual('citizenPhone' in body, false);
    });

    it('POST /api/locks/release releases acquired lock', async () => {
      const res = await fetch(`${baseUrl}/api/locks/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'ration_claim_card_1234',
          ownerId: 'worker_node_a',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.data.released, true);
    });

    it('POST /api/locks/acquire-distributed and release-distributed coordinate mutex', async () => {
      const lockRes = await fetch(`${baseUrl}/api/locks/acquire-distributed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'dist_worker_task_99',
          ownerId: 'worker_alpha',
          ttlMs: 5000,
        }),
      });
      assert.strictEqual(lockRes.status, 200);
      const lockBody = await lockRes.json();
      assert.strictEqual(lockBody.status, 'ok');
      assert.strictEqual(lockBody.data.acquired, true);

      // Conflicting lock attempt
      const conflictRes = await fetch(`${baseUrl}/api/locks/acquire-distributed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'dist_worker_task_99',
          ownerId: 'worker_beta',
          ttlMs: 5000,
        }),
      });
      assert.strictEqual(conflictRes.status, 409);

      // Release lock
      const releaseRes = await fetch(`${baseUrl}/api/locks/release-distributed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'dist_worker_task_99',
          ownerId: 'worker_alpha',
        }),
      });
      assert.strictEqual(releaseRes.status, 200);
      const releaseBody = await releaseRes.json();
      assert.strictEqual(releaseBody.data.released, true);
    });

    it('POST /api/locks/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/locks/clear`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/locks/clear flushes locks with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/locks/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testLocksKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('Compression Negotiator & Bandwidth Optimization Endpoints', () => {
    const testCompressionKey = 'janvaani_test_compression_secret_key';

    beforeEach(() => {
      process.env.COMPRESSION_ADMIN_KEY = testCompressionKey;
    });

    it('sets X-Negotiated-Encoding header to gzip for gzip-capable requests', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { 'Accept-Encoding': 'gzip, deflate, br' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-negotiated-encoding'), 'gzip');
    });

    it('respects q=0 to skip refused encodings (e.g. gzip;q=0 selects deflate)', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { 'Accept-Encoding': 'gzip;q=0, deflate;q=0.8' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-negotiated-encoding'), 'deflate');
    });

    it('selects br when highest q-value is specified', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { 'Accept-Encoding': 'gzip;q=0.5, br;q=1.0' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-negotiated-encoding'), 'br');
    });

    it('sets X-Negotiated-Encoding header to identity for plain requests', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { 'Accept-Encoding': 'identity' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-negotiated-encoding'), 'identity');
    });

    it('GET /api/compression/stats returns telemetry metrics', async () => {
      const res = await fetch(`${baseUrl}/api/compression/stats`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(typeof body.data.totalRequestsChecked, 'number');
    });

    it('POST /api/compression/test-negotiate tests client encoding preference', async () => {
      const res = await fetch(`${baseUrl}/api/compression/test-negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encoding: 'gzip' }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.data.negotiated, 'gzip');
      assert.strictEqual(body.data.supported, true);
    });

    it('POST /api/compression/test-negotiate rejects invalid encoding with 406 and zero PII reflection', async () => {
      const res = await fetch(`${baseUrl}/api/compression/test-negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encoding: 'unsupported_compression_algo',
          citizenPhone: '9845012345',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 406);
      assert.strictEqual(body.error.code, 'UNACCEPTABLE_ENCODING');
      assert.strictEqual('callerContact' in body, false);
      assert.strictEqual('citizenPhone' in body, false);
    });

    it('POST /api/compression/clear rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/compression/clear`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/compression/clear flushes telemetry with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/compression/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testCompressionKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('Civic Service Maintenance Window & Scheduled Downtime Endpoints', () => {
    const testMaintenanceKey = 'janvaani_test_maintenance_secret_key';

    beforeEach(() => {
      process.env.MAINTENANCE_ADMIN_KEY = testMaintenanceKey;
    });

    it('GET /api/maintenance/status returns initial non-maintenance state', async () => {
      const res = await fetch(`${baseUrl}/api/maintenance/status`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.data.isMaintenanceActive, false);
      assert.strictEqual(typeof body.data.configuredDurationSeconds, 'number');
    });

    it('POST /api/maintenance/enable rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/maintenance/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds: 60 }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/maintenance/enable rejects invalid durationSeconds with 400', async () => {
      const res = await fetch(`${baseUrl}/api/maintenance/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testMaintenanceKey,
        },
        body: JSON.stringify({ durationSeconds: -5 }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'INVALID_DURATION');
    });

    it('POST /api/maintenance/enable activates maintenance window and blocks civic traffic with 503 without PII reflection', async () => {
      const enableRes = await fetch(`${baseUrl}/api/maintenance/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': testMaintenanceKey,
        },
        body: JSON.stringify({
          durationSeconds: 120,
          reason: 'Scheduled Karnataka Bhoomi server database migration',
        }),
      });
      const enableBody = await enableRes.json();
      assert.strictEqual(enableRes.status, 200);
      assert.strictEqual(enableBody.status, 'ok');
      assert.strictEqual('callerContact' in enableBody.data, false);

      // Non-whitelisted route blocked with 503
      const blockedRes = await fetch(`${baseUrl}/`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const blockedBody = await blockedRes.json();
      assert.strictEqual(blockedRes.status, 503);
      assert.strictEqual(blockedBody.error.code, 'SERVICE_UNDER_MAINTENANCE');
      assert.strictEqual('callerPhone' in blockedBody, false);
      assert.strictEqual('citizenPhone' in blockedBody, false);
      assert.ok(blockedRes.headers.get('retry-after'));

      // Health probe remains accessible
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(healthRes.status, 200);
    });

    it('POST /api/maintenance/disable restores normal traffic', async () => {
      const disableRes = await fetch(`${baseUrl}/api/maintenance/disable`, {
        method: 'POST',
        headers: { 'x-admin-key': testMaintenanceKey },
      });
      assert.strictEqual(disableRes.status, 200);

      const restoredRes = await fetch(`${baseUrl}/`);
      assert.strictEqual(restoredRes.status, 200);
    });

    it('POST /api/maintenance/clear flushes audit log with valid admin key', async () => {
      const clearRes = await fetch(`${baseUrl}/api/maintenance/clear`, {
        method: 'POST',
        headers: { 'x-admin-key': testMaintenanceKey },
      });
      assert.strictEqual(clearRes.status, 200);

      const statusRes = await fetch(`${baseUrl}/api/maintenance/status`);
      const statusBody = await statusRes.json();
      assert.strictEqual(statusBody.data.totalAuditEntries, 0);
    });
  });

  describe('Baileys WhatsApp Gateway & QR Client Endpoints', () => {
    const testBaileysKey = 'janvaani_test_baileys_secret_key';

    beforeEach(() => {
      process.env.BAILEYS_ADMIN_KEY = testBaileysKey;
    });

    it('GET /api/baileys/status returns initial gateway connection status', async () => {
      const res = await fetch(`${baseUrl}/api/baileys/status`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(typeof body.data.isConnected, 'boolean');
      assert.strictEqual(typeof body.data.totalMessagesProcessed, 'number');
    });

    it('GET /api/baileys/qr returns pairing QR data status', async () => {
      const res = await fetch(`${baseUrl}/api/baileys/qr`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(typeof body.data.hasQr, 'boolean');
    });

    it('POST /api/baileys/simulate-inbound rejects empty message text with 400 and zero PII', async () => {
      const res = await fetch(`${baseUrl}/api/baileys/simulate-inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: '919845012345@s.whatsapp.net',
          text: '   ',
          senderPhone: '9845012345',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error.code, 'EMPTY_MESSAGE_TEXT');
      assert.strictEqual('senderPhone' in body, false);
      assert.strictEqual('citizenPhone' in body, false);
    });

    it('POST /api/baileys/simulate-inbound processes civic scheme inquiry and generates reply', async () => {
      const res = await fetch(`${baseUrl}/api/baileys/simulate-inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: '919845012345@s.whatsapp.net',
          text: 'ನನಗೆ ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಯ ಅರ್ಜಿ ಬೇಕು',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.data.feature, 'dhvani_form');
      assert.ok(body.data.replyText.includes('ಗೃಹಲಕ್ಷ್ಮಿ'));
    });

    it('POST /api/baileys/simulate-inbound processes acknowledgment status lookup', async () => {
      const res = await fetch(`${baseUrl}/api/baileys/simulate-inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: '919845012345@s.whatsapp.net',
          text: 'Check status for RD001',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.data.feature, 'audio_status_bell');
      assert.ok(body.data.replyText.includes('RD001'));
    });

    it('processes inbound audio voice note with Saaras STT', async () => {
      const { baileysGateway } = await import('../services/baileys-gateway.js');
      const dummyBuffer = Buffer.from('RIFF2400WAVEfmt ');
      const res = await baileysGateway.processInboundAudio('919845012345@s.whatsapp.net', dummyBuffer);
      assert.strictEqual(typeof res.transcript, 'string');
      assert.ok(res.replyText.length > 0);
    });

    it('POST /api/baileys/clear-session rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/baileys/clear-session`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/baileys/clear-session clears session with valid admin secret', async () => {
      const res = await fetch(`${baseUrl}/api/baileys/clear-session`, {
        method: 'POST',
        headers: { 'x-admin-key': testBaileysKey },
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  describe('JanVaani Voice-First Civic Services Dashboard Endpoints', () => {
    it('GET /api/dashboard/schemes returns verified welfare schemes', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/schemes`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(Array.isArray(body.data), true);
      assert.strictEqual(body.data.length, 2);
      assert.strictEqual(body.data[0].id, 'gruha-lakshmi');
      assert.strictEqual(body.data[0].matchPercentage, 98);
      assert.strictEqual(body.data[1].id, 'sandhya-suraksha');
      assert.strictEqual(body.data[1].matchPercentage, 92);
    });

    it('POST /api/dashboard/voice-query records citizen voice query', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/voice-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: 'ನನಗೆ 68 ವರ್ಷ, ತಿಂಗಳಿಗೆ ಯಾವುದೇ ಆದಾಯವಿಲ್ಲ',
          citizenPhone: '9876543210',
          language: 'kn',
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.recognizedText, 'ನನಗೆ 68 ವರ್ಷ, ತಿಂಗಳಿಗೆ ಯಾವುದೇ ಆದಾಯವಿಲ್ಲ');
    });

    it('POST /api/dashboard/voice-query rejects invalid payload with 400', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/voice-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: '',
          citizenPhone: '123',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.error, 'VALIDATION_ERROR');
    });

    it('POST /api/dashboard/whatsapp-checklist sends checklist to citizen', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/whatsapp-checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenPhone: '9876543210',
          applicantName: 'ರಾಧಾ ದೇವಿ',
          district: 'ಮೈಸೂರು',
          schemeIds: ['gruha-lakshmi', 'sandhya-suraksha'],
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.applicantName, 'ರಾಧಾ ದೇವಿ');
      assert.strictEqual(body.citizenPhone, maskId('9876543210'));
      assert.strictEqual(body.status, 'SENT');
    });

    it('POST /api/dashboard/clear-logs rejects unauthorized request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/clear-logs`, {
        method: 'POST',
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error, 'UNAUTHORIZED');
    });

    it('POST /api/dashboard/clear-logs flushes voice query log with admin secret', async () => {
      const testKey = 'test-dashboard-admin-key-2026';
      process.env.DASHBOARD_ADMIN_KEY = testKey;
      const res = await fetch(`${baseUrl}/api/dashboard/clear-logs`, {
        method: 'POST',
        headers: { 'x-admin-key': testKey },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });
  });

  describe('Citizen Draft Sessions & Form Slots Persistence Endpoints', () => {
    const testDraftKey = 'test_draft_session_admin_secret_8877';
    beforeEach(() => {
      process.env.DRAFT_SESSION_ADMIN_KEY = testDraftKey;
    });

    it('POST /api/drafts/save persists draft session with JSONB slots and GET /api/drafts/:id retrieves it', async () => {
      const sessionId = 'draft_session_test_998811';
      const saveRes = await fetch(`${baseUrl}/api/drafts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          phone: '9845012345',
          schemeId: 'gruha_lakshmi',
          currentState: 'COLLECTING',
          formSlots: {
            applicantName: 'ಲಕ್ಷ್ಮೀದೇವಿ',
            rationCardNumber: 'RC9988776655',
            district: 'Mandya',
          },
          confidenceScores: {
            applicantName: 0.96,
            rationCardNumber: 0.99,
          },
          missingFields: ['bankAccountNumber'],
          consentGiven: false,
        }),
      });

      assert.strictEqual(saveRes.status, 201);
      const saveBody = await saveRes.json();
      assert.strictEqual(saveBody.status, 'ok');
      assert.strictEqual(saveBody.data.sessionId, sessionId);
      assert.strictEqual(saveBody.data.formSlots.applicantName, 'ಲಕ್ಷ್ಮೀದೇವಿ');

      const getRes = await fetch(`${baseUrl}/api/drafts/${sessionId}`);
      assert.strictEqual(getRes.status, 200);
      const getBody = await getRes.json();
      assert.strictEqual(getBody.data.sessionId, sessionId);
      assert.strictEqual(getBody.data.schemeId, 'gruha_lakshmi');
      assert.strictEqual(getBody.data.formSlots.rationCardNumber, 'RC9988776655');

      // Unauthorized raw-inspect rejected with 401
      const unauthRes = await fetch(`${baseUrl}/api/drafts/raw-inspect/${sessionId}`);
      assert.strictEqual(unauthRes.status, 401);

      // Authorized raw-inspect succeeds
      const rawRes = await fetch(`${baseUrl}/api/drafts/raw-inspect/${sessionId}`, {
        headers: { 'x-admin-key': testDraftKey },
      });
      assert.strictEqual(rawRes.status, 200);
      const rawBody = await rawRes.json();
      assert.strictEqual(rawBody.success, true);
      assert.strictEqual(rawBody.data.sessionId, sessionId);
    });

    it('POST /api/drafts/save rejects missing sessionId with 400', async () => {
      const res = await fetch(`${baseUrl}/api/drafts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: 'gruha_lakshmi',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.error.code, 'INVALID_SESSION_ID');
    });

    it('POST /api/drafts/save rejects invalid state with 400', async () => {
      const res = await fetch(`${baseUrl}/api/drafts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test_invalid_state_123',
          schemeId: 'gruha_lakshmi',
          currentState: 'UNKNOWN_INVALID_STATE',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.error.code, 'INVALID_STATE');
    });

    it('GET /api/drafts/:id returns 404 for unknown session', async () => {
      const res = await fetch(`${baseUrl}/api/drafts/non-existent-session-000`);
      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.error.code, 'DRAFT_NOT_FOUND');
    });
  });
});





