import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import { whatsappMessageSchema, WhatsAppMessageInput } from '../schemas/whatsapp-message.js';
import { sarvamService } from '../services/sarvam.js';
import { schemesService, SUPPORTED_SCHEMES } from '../services/schemes.js';
import { trackerService } from '../services/tracker.js';

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
