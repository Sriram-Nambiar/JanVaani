import { sarvamService } from './sarvam.js';
import { KioskTokenIssueInput } from '../schemas/kiosk.js';
import { maskApplicantName, maskId } from './tracker.js';

export interface KioskToken {
  tokenId: string;
  tokenNumber: number;
  citizenName: string;
  phone: string;
  serviceType: string;
  serviceTitleKn: string;
  serviceTitleEn: string;
  village: string;
  taluk: string;
  counterNumber: number;
  status: 'WAITING' | 'CALLED' | 'COMPLETED';
  issuedAt: string;
  calledAt?: string;
  audioAnnouncementBase64?: string;
  announcementScriptKn?: string;
}

export class GramaOneKioskService {
  private tokens: Map<string, KioskToken> = new Map();
  private tokenSequence = 101;

  constructor() {
    this.seedDefaultTokens();
  }

  private seedDefaultTokens(): void {
    const seed: KioskToken = {
      tokenId: 'TOKEN-2026-101',
      tokenNumber: 101,
      citizenName: 'ಗೌರಮ್ಮ (Gowramma)',
      phone: '9845012345',
      serviceType: 'GRUHA_LAKSHMI',
      serviceTitleKn: 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ ಅರ್ಜಿ ನೋಂದಣಿ',
      serviceTitleEn: 'Gruha Lakshmi Scheme Registration',
      village: 'ನೆಲಮಂಗಲ (Nelamangala)',
      taluk: 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ',
      counterNumber: 1,
      status: 'WAITING',
      issuedAt: new Date(Date.now() - 600000).toISOString(),
    };
    this.tokens.set(seed.tokenId, seed);
  }

  public async issueToken(input: KioskTokenIssueInput): Promise<KioskToken> {
    const serviceTitles: Record<string, { kn: string; en: string }> = {
      GRUHA_JYOTHI: {
        kn: 'ಗೃಹಜ್ಯೋತಿ (200 ಯೂನಿಟ್ ಉಚಿತ ವಿದ್ಯುತ್)',
        en: 'Gruha Jyothi (Free Electricity)',
      },
      GRUHA_LAKSHMI: {
        kn: 'ಗೃಹಲಕ್ಷ್ಮಿ (₹2,000 ಮಾಸಿಕ ನೆರವು)',
        en: 'Gruha Lakshmi (Women Assistance)',
      },
      CASTE_INCOME: {
        kn: 'ಜಾತಿ & ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ',
        en: 'Caste & Income Certificate',
      },
      JANASPANDANA_GRIEVANCE: {
        kn: 'ಜನಸ್ಪಂದನ ದೂರು / ಮೇಲ್ಮನವಿ',
        en: 'JanaSpandana Grievance & Appeal',
      },
      DOCUMENT_VERIFICATION: {
        kn: 'ಕಾಗದ ತಪಾಸಣೆ (ದಾಖಲೆ ಪರಿಶೀಲನೆ)',
        en: 'Kagada-Check Document Verification',
      },
    };

    const sInfo = serviceTitles[input.serviceType] || {
      kn: 'ಗ್ರಾಮ ಒನ್ ನಾಗರಿಕ ಸೇವೆ',
      en: 'Grama One Citizen Service',
    };

    const tokenNumber = ++this.tokenSequence;
    const tokenId = `TOKEN-2026-${tokenNumber}`;
    const counterNumber = input.counterNumber ?? 1;

    const scriptKn = `ಟೋಕನ್ ಸಂಖ್ಯೆ ${tokenNumber}, ${input.citizenName}. ${sInfo.kn} ಸೇವೆಗಾಗಿ ದಯವಿಟ್ಟು ಕೌಂಟರ್ ${counterNumber} ಕ್ಕೆ ಬನ್ನಿ. ಧನ್ಯವಾದಗಳು.`;

    let audioAnnouncementBase64: string | undefined;
    try {
      const tts = await sarvamService.textToSpeech(scriptKn, 'kn-IN');
      audioAnnouncementBase64 = tts.audioBase64;
    } catch {
      audioAnnouncementBase64 = undefined;
    }

    const token: KioskToken = {
      tokenId,
      tokenNumber,
      citizenName: input.citizenName,
      phone: input.phone,
      serviceType: input.serviceType,
      serviceTitleKn: sInfo.kn,
      serviceTitleEn: sInfo.en,
      village: input.village || 'Nelamangala',
      taluk: input.taluk || 'Bengaluru Rural',
      counterNumber,
      status: 'WAITING',
      issuedAt: new Date().toISOString(),
      audioAnnouncementBase64,
      announcementScriptKn: scriptKn,
    };

    this.tokens.set(tokenId, token);
    return token;
  }

  public async callNext(counterNumber: number = 1): Promise<KioskToken | null> {
    const nextToken = Array.from(this.tokens.values()).find((t) => t.status === 'WAITING');
    if (!nextToken) return null;

    nextToken.status = 'CALLED';
    nextToken.counterNumber = counterNumber;
    nextToken.calledAt = new Date().toISOString();

    const scriptKn = `ಗಮನಿಸಿ: ಟೋಕನ್ ಸಂಖ್ಯೆ ${nextToken.tokenNumber}, ${nextToken.citizenName}. ದಯವಿಟ್ಟು ಕೌಂಟರ್ ${counterNumber} ಕ್ಕೆ ಬನ್ನಿ.`;
    try {
      const tts = await sarvamService.textToSpeech(scriptKn, 'kn-IN');
      nextToken.audioAnnouncementBase64 = tts.audioBase64;
      nextToken.announcementScriptKn = scriptKn;
    } catch {
      // ignore
    }

    return nextToken;
  }

  public getQueueSummary() {
    const all = Array.from(this.tokens.values());
    const waiting = all.filter((t) => t.status === 'WAITING');
    const called = all.filter((t) => t.status === 'CALLED');
    const completed = all.filter((t) => t.status === 'COMPLETED');

    return {
      totalTokensIssued: all.length,
      waitingCount: waiting.length,
      calledCount: called.length,
      completedCount: completed.length,
      waitingTokens: waiting.map((t) => ({
        tokenId: t.tokenId,
        tokenNumber: t.tokenNumber,
        citizenNameMasked: maskApplicantName(t.citizenName),
        serviceTitleKn: t.serviceTitleKn,
        issuedAt: t.issuedAt,
      })),
    };
  }

  public getToken(tokenId: string): KioskToken | null {
    return this.tokens.get(tokenId.toUpperCase()) || null;
  }
}

export const gramaOneKioskService = new GramaOneKioskService();
