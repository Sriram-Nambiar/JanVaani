import { Request, Response, Router } from 'express';
import crypto from 'node:crypto';
import { trackerService } from './tracker.js';
import { schemesService } from './schemes.js';

export interface InboundMessageRecord {
  id: string;
  from: string;
  text?: string;
  timestamp: number;
}

export interface BaileysGatewayStatus {
  isConnected: boolean;
  qrCodeAvailable: boolean;
  connectedJid?: string;
  totalMessagesProcessed: number;
}

const MAX_MESSAGE_HISTORY = 100;
const HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours
const WHATSAPP_JID_REGEX = /^[0-9]{10,15}(@s\.whatsapp\.net|@g\.us)?$/;

// Bounded in-memory message tracking log with capacity limit and retention pruning
const messageHistory: InboundMessageRecord[] = [];

let isConnected = false;
let currentQrCode: string | null = null;
let connectedJid: string | null = null;
let totalMessagesProcessed = 0;

function pruneHistory(now: number = Date.now()) {
  const cutoff = now - HISTORY_RETENTION_MS;
  while (messageHistory.length > 0 && messageHistory[0].timestamp < cutoff) {
    messageHistory.shift();
  }
}

function recordMessage(entry: InboundMessageRecord) {
  pruneHistory(entry.timestamp);
  if (messageHistory.length >= MAX_MESSAGE_HISTORY) {
    messageHistory.shift();
  }
  messageHistory.push(entry);
}

function isAuthorizedAdmin(req: Request): boolean {
  const configuredKey = process.env.BAILEYS_ADMIN_KEY;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return false;
  }
  const provided = req.headers['x-admin-key'];
  if (typeof provided !== 'string') {
    return false;
  }
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(configuredKey);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export class BaileysGateway {
  public getStatus(): BaileysGatewayStatus {
    return {
      isConnected,
      qrCodeAvailable: currentQrCode !== null,
      connectedJid: connectedJid || undefined,
      totalMessagesProcessed,
    };
  }

  public getLatestQr(): string | null {
    return currentQrCode;
  }

  public setQrCode(qr: string | null) {
    currentQrCode = qr;
  }

  public setConnected(status: boolean, jid?: string) {
    isConnected = status;
    connectedJid = jid || null;
    if (status) {
      currentQrCode = null;
    }
  }

  /**
   * Core message processing logic matching JanVaani Civic Copilot
   */
  public async processInbound(from: string, text: string): Promise<{ replyText: string; feature: string }> {
    totalMessagesProcessed++;

    recordMessage({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      from,
      text,
      timestamp: Date.now(),
    });

    const trimmed = text.trim();

    // 1. Check for RD / Acknowledgment tracking query
    const rdMatch = trimmed.match(/\b(RD\s*[0-9]{3,12}|GJ-[0-9]{4,10})\b/i);
    if (rdMatch) {
      const ackNumber = rdMatch[1].replace(/\s+/g, '').toUpperCase();
      const record = trackerService.lookupStatus(ackNumber);
      return {
        feature: 'audio_status_bell',
        replyText: `🔔 *JanVaani Civic Status Bell*\n\nಅರ್ಜಿ ಸಂಖ್ಯೆ (Ack No): *${record.ackNumber}*\nಯೋಜನೆ (Scheme): ${record.schemeNameKn}\nಪ್ರಸ್ತುತ ಸ್ಥಿತಿ (Status): *${record.currentStageKn}*\n\n${record.spokenNotificationKn}`,
      };
    }

    // 2. Default: Dhvani-Form application assistance
    const draft = schemesService.extractFormDraft(trimmed);
    return {
      feature: 'dhvani_form',
      replyText: `🏛️ *ಜನವಾಣಿ - JanVaani Civic Copilot*\n\nಯೋಜನೆ: *${draft.schemeNameKn}*\n${draft.promptForCitizenKn}`,
    };
  }

  public getHistoryCount(): number {
    pruneHistory();
    return messageHistory.length;
  }

  public clearHistory(): void {
    messageHistory.length = 0;
    totalMessagesProcessed = 0;
    isConnected = false;
    currentQrCode = null;
    connectedJid = null;
  }
}

export const baileysGateway = new BaileysGateway();
export const baileysRouter = Router();

/**
 * GET /api/baileys/status
 * Telemetry endpoint for Baileys WhatsApp client status
 */
baileysRouter.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: {
      ...baileysGateway.getStatus(),
      historyLogged: baileysGateway.getHistoryCount(),
    },
  });
});

/**
 * GET /api/baileys/qr
 * Fetch current pairing QR code string
 */
baileysRouter.get('/qr', (_req: Request, res: Response) => {
  const qr = baileysGateway.getLatestQr();
  res.status(200).json({
    status: 'ok',
    data: {
      hasQr: qr !== null,
      qr,
    },
  });
});

/**
 * POST /api/baileys/simulate-inbound
 * Test and simulation endpoint for incoming WhatsApp messages
 */
baileysRouter.post('/simulate-inbound', async (req: Request, res: Response) => {
  const rawFrom = req.body?.from;
  const from = typeof rawFrom === 'string' && WHATSAPP_JID_REGEX.test(rawFrom)
    ? rawFrom
    : '919845012345@s.whatsapp.net';

  const text = req.body?.text;

  if (typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'EMPTY_MESSAGE_TEXT',
        message: 'Inbound message text must be a non-empty string',
      },
    });
    return;
  }

  const result = await baileysGateway.processInbound(from, text);
  res.status(200).json({
    status: 'ok',
    data: result,
  });
});

/**
 * POST /api/baileys/clear-session
 * Admin endpoint to disconnect and clear session credentials
 */
baileysRouter.post('/clear-session', (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative authorization token required to clear Baileys WhatsApp session',
      },
    });
    return;
  }

  baileysGateway.clearHistory();

  res.status(200).json({
    status: 'ok',
    message: 'Baileys WhatsApp session and message history cleared',
  });
});
