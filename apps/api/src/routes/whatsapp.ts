import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import {
  whatsappMessageSchema,
  WhatsAppMessageInput,
  sevaSindhuSubmissionSchema,
  SevaSindhuSubmissionInput,
  GruhaJyothiFields,
  GruhaLakshmiFields,
  CasteIncomeFields,
  BmtcStudentPassFields,
} from '../schemas/whatsapp-message.js';
import {
  draftPdfSchema,
  DraftPdfInput,
  statusPushSchema,
  StatusPushInput,
} from '../schemas/draft-pdf.js';
import { sarvamService } from '../services/sarvam.js';
import { schemesService, SUPPORTED_SCHEMES } from '../services/schemes.js';
import { trackerService, maskApplicantName, maskId, ApplicationStatusRecord } from '../services/tracker.js';
import { draftPdfService } from '../services/pdf.js';
import { idempotencyEngine } from '../services/idempotency.js';
import { normalizeIndicText } from '../utils/indic-normalizer.js';
import { bmtcSessionManager } from '../services/bmtc-session.js';

export const whatsappRouter = Router();

/**
 * Unified WhatsApp Civic Copilot Message Processor
 * Handles Voice Notes (Dhvani-Form), Photos (Kagada-Check), and Text/Ack (Status Bell)
 */
whatsappRouter.post(
  '/message',
  validateBody(whatsappMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as WhatsAppMessageInput;

      // Webhook Idempotency & Deduplication Guard
      if (input.messageId) {
        const idemp = idempotencyEngine.checkAndRecord(input.messageId);
        if (idemp.isDuplicate) {
          return res.status(200).json({
            status: 'duplicate_ignored',
            feature: 'idempotency_guard',
            messageId: input.messageId,
            firstSeenAt: idemp.firstSeenAt,
            duplicateCount: idemp.duplicateCount,
            senderPhone: input.senderId,
            message: 'Duplicate webhook transmission ignored by idempotency engine',
          });
        }
      }

      // Indic Unicode & Digit Normalization
      if (input.text) {
        input.text = normalizeIndicText(input.text);
      }

      // 1. Process Voice Message (Dhvani-Form / Voice Status Check)
      if (input.type === 'voice') {
        const sttResult = await sarvamService.speechToText(
          {
            base64: input.audioBase64,
            mimeType: input.mimeType,
          },
          input.presetScenario || input.text
        );

        const transcript = input.text || sttResult.transcript;

        // Check if user is asking for application status (e.g. mentions RD or SEVA-DEMO number)
        const rdMatch = transcript.match(/\b(SEVA-DEMO-[A-Za-z0-9-]+|RD\s*[0-9]{3,12}|GJ-[A-Za-z0-9-]+)\b/i);
        if (rdMatch || input.presetScenario?.startsWith('status_check_')) {
          const ackNumber = rdMatch ? rdMatch[1].replace(/\s+/g, '') : (input.presetScenario?.split('_').pop()?.toUpperCase() || 'RD001');
          const statusRecord = trackerService.lookupStatus(ackNumber);
          const ttsResult = await sarvamService.textToSpeech(statusRecord.spokenNotificationKn);

          return res.status(200).json({
            status: 'ok',
            feature: 'audio_status_bell',
            transcript,
            statusRecord,
            audioBase64: ttsResult.audioBase64,
            messageKn: statusRecord.spokenNotificationKn,
            messageEn: statusRecord.spokenNotificationEn,
            isMock: sttResult.isMock || ttsResult.isMock,
          });
        }

        // Conversational BMTC Student Bus Pass Session Check
        const bmtcResult = await bmtcSessionManager.processMessage(input.senderId, transcript, input.presetScenario);
        if (bmtcResult) {
          const ttsResult = await sarvamService.textToSpeech(bmtcResult.messageKn);
          return res.status(200).json({
            status: 'ok',
            feature: 'dhvani_form',
            transcript,
            formDraft: bmtcResult.formDraft,
            statusRecord: bmtcResult.statusRecord,
            audioBase64: ttsResult.audioBase64,
            messageKn: bmtcResult.messageKn,
            messageEn: bmtcResult.messageEn,
            applicationId: bmtcResult.portalData?.applicationId,
            portalResponse: bmtcResult.portalData,
            isMock: sttResult.isMock || ttsResult.isMock,
          });
        }

        // Default: Dhvani-Form (Voice-to-Application Draft)
        const formDraft = schemesService.extractFormDraft(transcript, input.presetScenario);
        const ttsResult = await sarvamService.textToSpeech(formDraft.promptForCitizenKn);

        return res.status(200).json({
          status: 'ok',
          feature: 'dhvani_form',
          transcript,
          formDraft,
          audioBase64: ttsResult.audioBase64,
          messageKn: formDraft.promptForCitizenKn,
          messageEn: `Form draft created for ${formDraft.schemeNameEn}. Audio guidance attached.`,
          isMock: sttResult.isMock || ttsResult.isMock,
        });
      }

      // 2. Process Document Image (Kagada-Check)
      if (input.type === 'image') {
        const hasImage = Boolean(input.imageBase64 || input.imageUrl);
        const auditResult = schemesService.auditDocument(
          input.documentType || 'generic',
          hasImage,
          input.presetScenario
        );

        const ttsResult = await sarvamService.textToSpeech(auditResult.spokenVerdictKn);

        return res.status(200).json({
          status: 'ok',
          feature: 'kagada_check',
          auditResult,
          audioBase64: ttsResult.audioBase64,
          messageKn: auditResult.spokenVerdictKn,
          messageEn: auditResult.spokenVerdictEn,
          isMock: ttsResult.isMock,
        });
      }

      // 3. Process Text Message (Text queries or direct RD / BMTC input)
      if (input.type === 'text') {
        const text = (input.text || '').trim();
        const rdMatch = text.match(/\b(SEVA-DEMO-[A-Za-z0-9-]+|RD\s*[0-9]{3,12}|GJ-[A-Za-z0-9-]+)\b/i);

        if (rdMatch || input.presetScenario?.startsWith('status_check_')) {
          const ackNumber = rdMatch ? rdMatch[1].replace(/\s+/g, '') : (input.presetScenario?.split('_').pop()?.toUpperCase() || 'RD001');
          const statusRecord = trackerService.lookupStatus(ackNumber);
          const ttsResult = await sarvamService.textToSpeech(statusRecord.spokenNotificationKn);

          return res.status(200).json({
            status: 'ok',
            feature: 'audio_status_bell',
            query: text,
            statusRecord,
            audioBase64: ttsResult.audioBase64,
            messageKn: statusRecord.spokenNotificationKn,
            messageEn: statusRecord.spokenNotificationEn,
            isMock: ttsResult.isMock,
          });
        }

        // Conversational BMTC Student Bus Pass Session Check
        const bmtcResult = await bmtcSessionManager.processMessage(input.senderId, text, input.presetScenario);
        if (bmtcResult) {
          const ttsResult = await sarvamService.textToSpeech(bmtcResult.messageKn);
          return res.status(200).json({
            status: 'ok',
            feature: 'dhvani_form',
            query: text,
            formDraft: bmtcResult.formDraft,
            statusRecord: bmtcResult.statusRecord,
            audioBase64: ttsResult.audioBase64,
            messageKn: bmtcResult.messageKn,
            messageEn: bmtcResult.messageEn,
            applicationId: bmtcResult.portalData?.applicationId,
            portalResponse: bmtcResult.portalData,
            isMock: ttsResult.isMock,
          });
        }

        // Treat text as transcribed scheme query
        const formDraft = schemesService.extractFormDraft(text, input.presetScenario);
        const ttsResult = await sarvamService.textToSpeech(formDraft.promptForCitizenKn);

        return res.status(200).json({
          status: 'ok',
          feature: 'dhvani_form',
          query: text,
          formDraft,
          audioBase64: ttsResult.audioBase64,
          messageKn: formDraft.promptForCitizenKn,
          messageEn: `Form draft created for ${formDraft.schemeNameEn}.`,
          isMock: ttsResult.isMock,
        });
      }

      return res.status(400).json({
        error: {
          code: 'UNSUPPORTED_TYPE',
          message: 'Unsupported message type.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * List all supported Karnataka schemes
 */
whatsappRouter.get('/schemes', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: Object.values(SUPPORTED_SCHEMES),
  });
});

/**
 * Autonomous Agent Endpoint: Submits application to Mock Seva Sindhu Portal
 * Protected with Zod schema validation, cryptographically unique receipt generation, and PII masking
 */
whatsappRouter.post(
  '/agent/submit-seva-sindhu',
  validateBody(sevaSindhuSubmissionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submission = req.body as SevaSindhuSubmissionInput;
      const { schemeId, fields } = submission;

      let statusRecord: ApplicationStatusRecord | null = null;
      let responseDetails: Record<string, any> = {};
      let maskedApplicant = '';

      if (schemeId === 'gruha_jyothi') {
        const gjFields = fields as GruhaJyothiFields;
        const maskedName = maskApplicantName(gjFields.applicantName);
        const maskedConsumerId = maskId(gjFields.consumerId);
        maskedApplicant = maskedName;

        statusRecord = trackerService.registerUniqueRecord(
          (ackNumber) => ({
            ackNumber,
            schemeId: 'gruha_jyothi',
            schemeNameKn: 'ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆ (200 ಯೂನಿಟ್ ಉಚಿತ ವಿದ್ಯುತ್)',
            schemeNameEn: 'Gruha Jyothi Scheme (Free Electricity)',
            applicantName: maskedName,
            currentStageKn: `ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ - ${gjFields.escomName} ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ`,
            currentStageEn: `Received at Seva Sindhu - Under ${gjFields.escomName} Verification`,
            isReadyForDownload: false,
            timeline: [
              {
                step: 1,
                labelKn: 'ಸೇವಾ ಸಿಂಧು ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ',
                labelEn: 'Application Submitted via Seva Sindhu',
                status: 'COMPLETED' as const,
                updatedAt: new Date().toISOString().split('T')[0],
              },
              {
                step: 2,
                labelKn: `${gjFields.escomName} ಗ್ರಾಹಕ ಖಾತೆ ಪರಿಶೀಲನೆ`,
                labelEn: `${gjFields.escomName} Consumer Account Verification`,
                status: 'IN_PROGRESS' as const,
              },
              {
                step: 3,
                labelKn: 'ಆಧಾರ್ ಮತ್ತು ಮೀಟರ್ ಲಿಂಕ್',
                labelEn: 'Aadhaar & Meter Linking',
                status: 'PENDING' as const,
              },
              {
                step: 4,
                labelKn: 'ಶೂನ್ಯ ಬಿಲ್ ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆ (Zero Bill Active)',
                labelEn: 'Zero Bill Subsidy Activated',
                status: 'PENDING' as const,
              },
            ],
            spokenNotificationKn: `ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಗೃಹ ಜ್ಯೋತಿ ಅರ್ಜಿಯನ್ನು ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${ackNumber}.`,
            spokenNotificationEn: `Success! Your Gruha Jyothi application has been submitted to Seva Sindhu. Your acknowledgment number is ${ackNumber}.`,
          }),
          () => {
            const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
            return `GJ-${gjFields.escomName}-2026-${entropy}`;
          }
        );

        responseDetails = {
          consumerId: maskedConsumerId,
          escomName: gjFields.escomName,
        };
      } else if (schemeId === 'gruha_lakshmi') {
        const glFields = fields as GruhaLakshmiFields;
        const maskedName = maskApplicantName(glFields.applicantName);
        const maskedRation = maskId(glFields.rationCardNumber);
        maskedApplicant = maskedName;

        statusRecord = trackerService.registerUniqueRecord(
          (ackNumber) => ({
            ackNumber,
            schemeId: 'gruha_lakshmi',
            schemeNameKn: 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ (ಕುಟುಂಬದ ಯಜಮಾನಿ ಮಹಿಳೆಗೆ ₹2,000)',
            schemeNameEn: 'Gruha Lakshmi Scheme (₹2,000 Monthly Assistance)',
            applicantName: maskedName,
            currentStageKn: 'ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ - ಡಿಬಿಟಿ ಬ್ಯಾಂಕ್ ಖಾತೆ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
            currentStageEn: 'Received at Seva Sindhu - DBT Bank Seeding in Progress',
            isReadyForDownload: false,
            timeline: [
              {
                step: 1,
                labelKn: 'ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
                labelEn: 'Application Submitted',
                status: 'COMPLETED' as const,
                updatedAt: new Date().toISOString().split('T')[0],
              },
              {
                step: 2,
                labelKn: 'ಪಡಿತರ ಚೀಟಿ ಮತ್ತು ಆಧಾರ್ ಪರಿಶೀಲನೆ',
                labelEn: 'Ration Card & Aadhaar Verification',
                status: 'IN_PROGRESS' as const,
              },
              {
                step: 3,
                labelKn: 'ಡಿಬಿಟಿ ಖಾತೆ ಅನುಮೋದನೆ',
                labelEn: 'DBT Account Approval',
                status: 'PENDING' as const,
              },
              {
                step: 4,
                labelKn: 'ಮಾಸಿಕ ₹2,000 ಹಣ ಜಮೆ',
                labelEn: 'Monthly ₹2,000 Benefit Dispatched',
                status: 'PENDING' as const,
              },
            ],
            spokenNotificationKn: `ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಯ ಅರ್ಜಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${ackNumber}.`,
            spokenNotificationEn: `Success! Your Gruha Lakshmi application has been submitted to Seva Sindhu. Your acknowledgment number is ${ackNumber}.`,
          }),
          () => {
            const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
            return `GL-KAR-2026-${entropy}`;
          }
        );

        responseDetails = {
          rationCardNumber: maskedRation,
          bankAccountNumber: maskId(glFields.bankAccountNumber),
        };
      } else if (schemeId === 'caste_income') {
        const ciFields = fields as CasteIncomeFields;
        const maskedName = maskApplicantName(ciFields.applicantName);
        maskedApplicant = maskedName;

        statusRecord = trackerService.registerUniqueRecord(
          (ackNumber) => ({
            ackNumber,
            schemeId: 'caste_income',
            schemeNameKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ',
            schemeNameEn: 'Caste & Income Certificate',
            applicantName: maskedName,
            currentStageKn: `${ciFields.taluk} ತಾಲೂಕು ಕಚೇರಿಯಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ - ಕಂದಾಯ ನಿರೀಕ್ಷಕರ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ`,
            currentStageEn: `Received at ${ciFields.taluk} Taluk Office - Under RI Verification`,
            isReadyForDownload: false,
            timeline: [
              {
                step: 1,
                labelKn: 'ಗ್ರಾಮ ಒನ್ / ಸೇವಾ ಸಿಂಧು ಅರ್ಜಿ ಸಲ್ಲಿಕೆ',
                labelEn: 'Application Submitted',
                status: 'COMPLETED' as const,
                updatedAt: new Date().toISOString().split('T')[0],
              },
              {
                step: 2,
                labelKn: 'ಕಂದಾಯ ನಿರೀಕ್ಷಕರ (RI) ಸ್ಥಳ ಪರಿಶೀಲನೆ',
                labelEn: 'Revenue Inspector Verification',
                status: 'IN_PROGRESS' as const,
              },
              {
                step: 3,
                labelKn: 'ತಹಸೀಲ್ದಾರ್ ಡಿಜಿಟಲ್ ಸಹಿ ಮತ್ತು ಅನುಮೋದನೆ',
                labelEn: 'Tahsildar Digital Signature & Approval',
                status: 'PENDING' as const,
              },
              {
                step: 4,
                labelKn: 'ಪ್ರಮಾಣ ಪತ್ರ ವಿತರಣೆ / ಡೌನ್‌ಲೋಡ್',
                labelEn: 'Certificate Dispatched / Ready for Download',
                status: 'PENDING' as const,
              },
            ],
            spokenNotificationKn: `ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರದ ಅರ್ಜಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${ackNumber}.`,
            spokenNotificationEn: `Success! Your Caste & Income Certificate application has been submitted. Your acknowledgment number is ${ackNumber}.`,
          }),
          () => {
            const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
            return `RD-KAR-2026-${entropy}`;
          }
        );

        responseDetails = {
          category: ciFields.category,
          taluk: ciFields.taluk,
        };
      } else if (schemeId === 'bmtc_student_pass') {
        const bmtcFields = fields as BmtcStudentPassFields;
        const maskedName = maskApplicantName(bmtcFields.studentName);
        const maskedAadhaar = 'XXXX-XXXX-' + (bmtcFields.aadhaarNumber.replace(/\D/g, '').slice(-4) || '5028');
        maskedApplicant = maskedName;

        let portalAppId = '';
        let portalAck = '';

        try {
          const sevaApiUrl = process.env.SEVA_API_URL || 'http://localhost:3002';
          const resPortal = await fetch(`${sevaApiUrl}/api/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: bmtcFields.studentName,
              aadhaarNumber: bmtcFields.aadhaarNumber,
              phoneNumber: bmtcFields.mobileNumber,
              mobileNumber: bmtcFields.mobileNumber,
              institutionName: bmtcFields.institutionName,
              courseYear: bmtcFields.course,
              course: bmtcFields.course,
              pickupStop: bmtcFields.pickupStop,
              destinationStop: bmtcFields.destinationStop,
              demoOtp: bmtcFields.otpCode || '3344',
              otpCode: bmtcFields.otpCode || '3344',
              submittedVia: 'JANVAANI_AI',
            }),
          });
          if (resPortal.ok) {
            const data = await resPortal.json();
            portalAppId = data.applicationId;
            portalAck = data.acknowledgement;
          }
        } catch (err: any) {
          console.warn('[JanVaani Seva Portal agent dispatch] fallback:', err.message);
        }

        statusRecord = trackerService.registerUniqueRecord(
          (ackNumber) => ({
            ackNumber,
            schemeId: 'bmtc_student_pass',
            schemeNameKn: 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್',
            schemeNameEn: 'BMTC Student Concessional Bus Pass',
            applicantName: maskedName,
            aadhaarMasked: maskedAadhaar,
            currentStageKn: 'ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ - ಬಿಎಂಟಿಸಿ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
            currentStageEn: 'Received at Seva Sindhu - Under BMTC Verification',
            isReadyForDownload: false,
            timeline: [
              {
                step: 1,
                labelKn: 'ಸೇವಾ ಸಿಂಧು ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ',
                labelEn: 'Application Submitted via Seva Sindhu',
                status: 'COMPLETED' as const,
                updatedAt: new Date().toISOString().split('T')[0],
              },
              {
                step: 2,
                labelKn: 'ಕಾಲೇಜು ಮತ್ತು ಆಧಾರ್ ಪರಿಶೀಲನೆ',
                labelEn: 'College & Aadhaar Verification',
                status: 'IN_PROGRESS' as const,
              },
              {
                step: 3,
                labelKn: 'ಬಿಎಂಟಿಸಿ ವಿಭಾಗ ಅನುಮೋದನೆ',
                labelEn: 'BMTC Division Approval',
                status: 'PENDING' as const,
              },
              {
                step: 4,
                labelKn: 'ಸ್ಮಾರ್ಟ್ ಪಾಸ್ ವಿತರಣೆ',
                labelEn: 'Smart Card Pass Issued',
                status: 'PENDING' as const,
              },
            ],
            spokenNotificationKn: `ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಬಸ್ ಪಾಸ್ ಅರ್ಜಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${ackNumber}.`,
            spokenNotificationEn: portalAck || `Success! Your BMTC Student Pass application has been submitted to Seva Sindhu. Your acknowledgment number is ${ackNumber}.`,
          }),
          () => portalAppId || `SEVA-DEMO-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
        );

        responseDetails = {
          institutionName: bmtcFields.institutionName,
          route: `${bmtcFields.pickupStop} -> ${bmtcFields.destinationStop}`,
          aadhaarMasked: maskedAadhaar,
        };
      }

      if (!statusRecord) {
        return res.status(503).json({
          error: {
            code: 'REGISTRATION_EXHAUSTED',
            message: 'Karnataka State Gateway is currently busy. Please try submitting again.',
          },
        });
      }

      const ttsResult = await sarvamService.textToSpeech(statusRecord.spokenNotificationKn);

      res.status(200).json({
        status: 'ok',
        acknowledgmentNumber: statusRecord.ackNumber,
        schemeId,
        applicantName: maskedApplicant,
        ...responseDetails,
        submittedAt: new Date().toISOString(),
        audioBase64: ttsResult.audioBase64,
        spokenNotificationKn: statusRecord.spokenNotificationKn,
        spokenNotificationEn: statusRecord.spokenNotificationEn,
        statusRecord,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Direct lookup for application status by acknowledgment number
 */
whatsappRouter.get('/status/:ackNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ackNumber = req.params.ackNumber;
    const statusRecord = trackerService.lookupStatus(ackNumber);
    const ttsResult = await sarvamService.textToSpeech(statusRecord.spokenNotificationKn);

    res.status(200).json({
      status: 'ok',
      data: statusRecord,
      audioBase64: ttsResult.audioBase64,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Meta WhatsApp Cloud API Webhook Verification (GET)
 */
whatsappRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'janvaani_webhook_secret';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * Generate printable Application Draft HTML document
 */
whatsappRouter.post(
  '/draft/generate-html',
  validateBody(draftPdfSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as DraftPdfInput;
      const html = draftPdfService.generateDraftHtml(input);

      res.status(200).json({
        status: 'ok',
        ackNumber: input.ackNumber,
        html,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Direct printable Application Draft HTML view
 */
whatsappRouter.get(
  '/draft/:ackNumber/html',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const ackNumber = req.params.ackNumber;
      const record = trackerService.lookupStatus(ackNumber);

      const html = draftPdfService.generateDraftHtml({
        ackNumber: record.ackNumber,
        schemeId:
          record.schemeId ||
          (record.ackNumber.startsWith('GJ-')
            ? 'gruha_jyothi'
            : record.schemeNameKn.includes('ಗೃಹಲಕ್ಷ್ಮಿ')
            ? 'gruha_lakshmi'
            : 'caste_income'),
        applicantName: record.applicantName,
        auditFindings: record.auditFindings || [
          {
            field: 'Identity Verification (Aadhaar)',
            status: 'PASSED',
            noteKn: 'ದಾಖಲೆ ವಿವರಗಳು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ',
            noteEn: 'Identity verified against state records',
          },
        ],
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Authentication and authorization guard for simulated officer actions
 */
export function requireOfficerSimulatorAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const adminKey =
    req.headers['x-admin-key'] ||
    (typeof req.headers['authorization'] === 'string' && req.headers['authorization'].startsWith('Bearer ')
      ? req.headers['authorization'].slice(7)
      : undefined);
  const expectedKey = process.env.DEMO_ADMIN_KEY || 'janvaani_demo_secret';

  if (!adminKey || adminKey !== expectedKey) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization required to simulate officer status transitions.',
      },
    });
  }

  next();
}

/**
 * Simulated Officer Push Notification Dispatcher
 * Protected by requireOfficerSimulatorAuth administrative authorization guard
 */
whatsappRouter.post(
  '/status/simulate-push',
  requireOfficerSimulatorAuth,
  validateBody(statusPushSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as StatusPushInput;
      const updatedRecord = trackerService.updateStage(input.ackNumber, input.stage, input.customMessageKn);
      const ttsResult = await sarvamService.textToSpeech(updatedRecord.spokenNotificationKn);

      res.status(200).json({
        status: 'ok',
        ackNumber: input.ackNumber,
        stage: input.stage,
        updatedRecord,
        spokenNotificationKn: updatedRecord.spokenNotificationKn,
        spokenNotificationEn: updatedRecord.spokenNotificationEn,
        audioBase64: ttsResult.audioBase64,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/whatsapp/idempotency/stats
 * Inspect active deduplication cache window and caught duplicates count
 */
whatsappRouter.get('/idempotency/stats', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: idempotencyEngine.getStats(),
  });
});

