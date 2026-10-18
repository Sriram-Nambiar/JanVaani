import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      baileysGateway.setQrCode(qr);
      console.log('\n=============================================================');
      console.log('📲 SCAN THIS QR CODE WITH WHATSAPP TO LINK JANVAANI BOT:');
      console.log('   (WhatsApp on Phone > Settings > Linked Devices > Link a Device)');
      console.log('=============================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('=============================================================\n');

      // Export high-resolution PNG & HTML for reliable scanning
      try {
        const outputDir = process.env.QR_OUTPUT_DIR || path.join(process.cwd(), '.qr');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const pngPath = path.join(outputDir, 'bot-qr.png');
        await QRCode.toFile(pngPath, qr, {
          width: 480,
          margin: 3,
          color: { dark: '#000000', light: '#ffffff' },
        });

        const dataUrl = await QRCode.toDataURL(qr, { width: 480, margin: 3 });
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>JanVaani WhatsApp Bot QR Code</title>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="20">
  <style>
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b141a; color: #e9edef; text-align: center; }
    .card { background: #111b21; padding: 28px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); max-width: 440px; }
    h2 { color: #00a884; margin-top: 0; }
    ol { text-align: left; line-height: 1.6; font-size: 15px; color: #aebac1; }
    img { border: 12px solid #ffffff; border-radius: 12px; margin: 16px 0; max-width: 90%; }
    .status { color: #25d366; font-size: 13px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <h2>JanVaani WhatsApp Bot</h2>
    <ol>
      <li>Open WhatsApp on your phone</li>
      <li>Tap <b>Settings</b> or <b>3 dots ⋮</b> &gt; <b>Linked Devices</b></li>
      <li>Tap <b>Link a Device</b> and point camera here:</li>
    </ol>
    <img src="${dataUrl}" alt="JanVaani WhatsApp QR Code" />
    <div class="status">⚡ Auto-refreshing live session...</div>
  </div>
</body>
</html>`;
        fs.writeFileSync(path.join(outputDir, 'bot-qr.html'), htmlContent);
        console.log(`🖼️  QR Code saved to ${path.join(outputDir, 'bot-qr.html')} and bot-qr.png!`);
      } catch (e) {
        console.error('Failed to export QR file:', e);
      }
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

      const isAudio = Boolean(msg.message.audioMessage);
      if (isAudio) {
        try {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          const response = await baileysGateway.processInboundAudio(sender, buffer as Buffer);
          sock.sendMessage(sender, { text: response.replyText });
          console.log(`📤 Voice reply dispatched for ${sender}`);
        } catch (err) {
          console.error(`❌ Failed to process voice note from ${sender}:`, err);
        }
        continue;
      }

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
