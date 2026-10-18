import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { baileysGateway } from './services/baileys-gateway.js';

export async function runWhatsAppBot() {
  console.log('\n🚀 Starting JanVaani WhatsApp Bot (Baileys Engine)...');

  const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📱 Baileys Version: v${version.join('.')} (Latest: ${isLatest})`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['JanVaani Civic Bot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      baileysGateway.setQrCode(qr);
      console.log('\n=============================================================');
      console.log('📲 SCAN THIS QR CODE WITH WHATSAPP TO LINK JANVAANI BOT:');
      console.log('   (WhatsApp on Phone > Settings > Linked Devices > Link a Device)');
      console.log('=============================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('=============================================================\n');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`⚠️ Connection closed (status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
      baileysGateway.setConnected(false);
      if (shouldReconnect) {
        setTimeout(runWhatsAppBot, 3000);
      }
    } else if (connection === 'open') {
      const jid = sock.user?.id || 'JanVaani';
      baileysGateway.setConnected(true, jid);
      console.log('\n✅ =========================================================');
      console.log(`🎉 JANVAANI WHATSAPP BOT IS LIVE! Connected as: ${jid}`);
      console.log('   Send any message in Kannada or English to this number!');
      console.log('=========================================================\n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const sender = msg.key.remoteJid;
      if (!sender) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      if (!text.trim()) continue;

      console.log(`📩 Incoming message from ${sender}: "${text}"`);

      try {
        const response = await baileysGateway.processInbound(sender, text);
        await sock.sendMessage(sender, { text: response.replyText });
        console.log(`📤 Replied to ${sender} (${response.feature})`);
      } catch (err) {
        console.error(`❌ Error replying to ${sender}:`, err);
        await sock.sendMessage(sender, {
          text: 'ಕ್ಷಮಿಸಿ, ತಾಂತ್ರಿಕ ಸಮಸ್ಯೆಯಿಂದಾಗಿ ಉತ್ತರ ನೀಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.\n(Sorry, a technical error occurred. Please try again.)',
        });
      }
    }
  });
}

// Auto-run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runWhatsAppBot().catch((err) => {
    console.error('Fatal bot error:', err);
  });
}
