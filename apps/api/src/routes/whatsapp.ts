import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import {
  whatsappMessageSchema,
  WhatsAppMessageInput,
  sevaSindhuSubmissionSchema,
  SevaSindhuSubmissionInput,
} from '../schemas/whatsapp-message.js';
import {
  draftPdfSchema,
  DraftPdfInput,
  statusPushSchema,
  StatusPushInput,
} from '../schemas/draft-pdf.js';
import { sarvamService } from '../services/sarvam.js';
import { schemesService, SUPPORTED_SCHEMES } from '../services/schemes.js';
import { trackerService, maskApplicantName, maskId } from '../services/tracker.js';
import { draftPdfService } from '../services/pdf.js';

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

        // Check if user is asking for application status (e.g. mentions RD number)
        const rdMatch = transcript.match(/\b(RD\s*[0-9]{3,12})\b/i);
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

      // 3. Process Text Message (Text queries or direct RD input)
      if (input.type === 'text') {
        const text = (input.text || '').trim();
        const rdMatch = text.match(/\b(RD\s*[0-9]{3,12})\b/i);

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
      const { schemeId, fields } = req.body as SevaSindhuSubmissionInput;

      // Mask sensitive citizen PII to prevent data exposure upon public acknowledgment lookup
      const maskedName = maskApplicantName(fields.applicantName);
      const maskedConsumerId = maskId(fields.consumerId);

      // Atomically allocate unique acknowledgment number and register in tracker
      const statusRecord = trackerService.registerUniqueRecord(
        (ackNumber) => ({
          ackNumber,
          schemeNameKn: 'ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆ (200 ಯೂನಿಟ್ ಉಚಿತ ವಿದ್ಯುತ್)',
          schemeNameEn: 'Gruha Jyothi Scheme (Free Electricity)',
          applicantName: maskedName,
          currentStageKn: `ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ - ${fields.escomName} ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ`,
          currentStageEn: `Received at Seva Sindhu - Under ${fields.escomName} Verification`,
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
              labelKn: `${fields.escomName} ಗ್ರಾಹಕ ಖಾತೆ ಪರಿಶೀಲನೆ`,
              labelEn: `${fields.escomName} Consumer Account Verification`,
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
          return `GJ-${fields.escomName}-2026-${entropy}`;
        }
      );

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
        applicantName: maskedName,
        consumerId: maskedConsumerId,
        escomName: fields.escomName,
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
        schemeId: record.ackNumber.startsWith('GJ-')
          ? 'gruha_jyothi'
          : record.ackNumber === 'RD002'
          ? 'gruha_lakshmi'
          : 'caste_income',
        applicantName: record.applicantName,
        auditFindings: [
          {
            field: 'Aadhaar Card',
            status: 'PASSED',
            noteKn: 'ಆಧಾರ್ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ',
            noteEn: 'Aadhaar identity verified against state records',
          },
          {
            field: 'Ration Card',
            status: 'PASSED',
            noteKn: 'ಪಡಿತರ ಚೀಟಿ ಸಿಂಧುವಾಗಿದೆ',
            noteEn: 'Ration card active and matched',
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
 * Simulated Officer Push Notification Dispatcher
 * Allows an authorized administrative simulator to advance an application's stage
 * and triggers an unprompted, authentic Kannada voice alert delivered to the citizen.
 */
whatsappRouter.post(
  '/status/simulate-push',
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
