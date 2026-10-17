import { sarvamService } from './sarvam.js';
import { AudioReceiptInput } from '../schemas/audio-receipt.js';
import { maskApplicantName, maskId, trackerService } from './tracker.js';

export interface AudioReceiptResult {
  ackNumber: string;
  schemeId: string;
  schemeTitleKn: string;
  schemeTitleEn: string;
  applicantNameMasked: string;
  entitlementSummaryKn: string;
  entitlementSummaryEn: string;
  audioBase64: string;
  mimeType: string;
  generatedAt: string;
}

export class AudioReceiptService {
  private receiptCache: Map<string, AudioReceiptResult> = new Map();

  public async generateReceipt(input: AudioReceiptInput): Promise<AudioReceiptResult> {
    const schemeTitles: Record<string, { kn: string; en: string }> = {
      gruha_jyothi: {
        kn: 'ಗೃಹಜ್ಯೋತಿ ಯೋಜನೆ (200 ಯೂನಿಟ್ ಉಚಿತ ವಿದ್ಯುತ್)',
        en: 'Gruha Jyothi Scheme (200 Units Free Electricity)',
      },
      gruha_lakshmi: {
        kn: 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ (₹2,000 ಮಾಸಿಕ ಧನಸಹಾಯ)',
        en: 'Gruha Lakshmi Scheme (₹2,000/mo Financial Assistance)',
      },
      caste_income: {
        kn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ',
        en: 'Caste & Income Certificate',
      },
    };

    const schemeInfo = schemeTitles[input.schemeId] || {
      kn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಯೋಜನೆ',
      en: 'Karnataka Government Scheme',
    };

    let scriptKn = '';
    let entitlementKn = '';
    let entitlementEn = '';

    if (input.schemeId === 'gruha_jyothi') {
      entitlementKn = 'ಪ್ರತಿ ತಿಂಗಳು 200 ಯೂನಿಟ್ ವರೆಗೆ ಉಚಿತ ಗೃಹಬಳಕೆ ವಿದ್ಯುತ್';
      entitlementEn = 'Up to 200 units free domestic electricity per month';
      scriptKn = `ನಮಸ್ಕಾರ ${input.applicantName}. ನಿಮ್ಮ ಗೃಹಜ್ಯೋತಿ ಯೋಜನೆ ಅರ್ಜಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${input.ackNumber}. ಪ್ರತಿ ತಿಂಗಳು 200 ಯೂನಿಟ್ ವರೆಗೆ ಉಚಿತ ಗೃಹಬಳಕೆ ವಿದ್ಯುತ್ ಸೌಲಭ್ಯ ನಿಮ್ಮ ಸಂಪರ್ಕಕ್ಕೆ ಅನ್ವಯವಾಗಲಿದೆ. ಧನ್ಯವಾದಗಳು.`;
    } else if (input.schemeId === 'gruha_lakshmi') {
      entitlementKn = 'ಮನೆಯ ಯಜಮಾನಿಗೆ ತಿಂಗಳಿಗೆ ₹2,000 ನೇರ ನಗದು ವರ್ಗಾವಣೆ (DBT)';
      entitlementEn = '₹2,000 monthly direct benefit transfer (DBT) to woman head of household';
      scriptKn = `ನಮಸ್ಕಾರ ${input.applicantName}. ನಿಮ್ಮ ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ ಅರ್ಜಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${input.ackNumber}. ಅರ್ಹ ಮಹಿಳಾ ಫಲಾನುಭವಿಗೆ ತಿಂಗಳಿಗೆ 2000 ರೂಪಾಯಿ ಆರ್ಥಿಕ ನೆರವು ನೇರವಾಗಿ ನಿಮ್ಮ ಆಧಾರ್ ಜೋಡಿತ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆಯಾಗಲಿದೆ. ಧನ್ಯವಾದಗಳು.`;
    } else {
      entitlementKn = 'ನಾಡಕಚೇರಿ ತಹಶೀಲ್ದಾರ್ ಅನುಮೋದಿತ ಡಿಜಿಟಲ್ ಪ್ರಮಾಣ ಪತ್ರ (ಮಾನ್ಯತೆ: ೫ ವರ್ಷ)';
      entitlementEn = 'Tahsildar approved digital certificate (Validity: 5 Years)';
      scriptKn = `ನಮಸ್ಕಾರ ${input.applicantName}. ನಿಮ್ಮ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಅರ್ಜಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${input.ackNumber}. 21 ದಿನಗಳಲ್ಲಿ ತಹಶೀಲ್ದಾರ್ ಕಾರ್ಯಾಲಯದಿಂದ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡು ಡಿಜಿಟಲ್ ಪ್ರಮಾಣ ಪತ್ರ ಬಿಡುಗಡೆಯಾಗಲಿದೆ. ಧನ್ಯವಾದಗಳು.`;
    }

    let audioBase64 = '';
    try {
      const tts = await sarvamService.textToSpeech(scriptKn, 'kn-IN');
      audioBase64 = tts.audioBase64;
    } catch {
      audioBase64 = '';
    }

    const result: AudioReceiptResult = {
      ackNumber: input.ackNumber.toUpperCase(),
      schemeId: input.schemeId,
      schemeTitleKn: schemeInfo.kn,
      schemeTitleEn: schemeInfo.en,
      applicantNameMasked: maskApplicantName(input.applicantName),
      entitlementSummaryKn: entitlementKn,
      entitlementSummaryEn: entitlementEn,
      audioBase64,
      mimeType: 'audio/wav',
      generatedAt: new Date().toISOString(),
    };

    this.receiptCache.set(input.ackNumber.toUpperCase(), result);
    return result;
  }

  public async getReceipt(ackNumber: string): Promise<AudioReceiptResult | null> {
    const cached = this.receiptCache.get(ackNumber.toUpperCase());
    if (cached) return cached;

    // Check if tracker has this record to auto-synthesize
    if (!trackerService.hasRecord(ackNumber)) return null;
    const record = trackerService.lookupStatus(ackNumber);

    const normalizedAck = ackNumber.toUpperCase();
    let targetScheme: 'gruha_jyothi' | 'gruha_lakshmi' | 'caste_income' = 'gruha_jyothi';
    if (normalizedAck.startsWith('GL-')) targetScheme = 'gruha_lakshmi';
    else if (normalizedAck.startsWith('RD-') || normalizedAck === 'RD001' || normalizedAck === 'RD002' || normalizedAck === 'RD003') {
      targetScheme = 'caste_income';
    }

    return this.generateReceipt({
      ackNumber: record.ackNumber,
      schemeId: targetScheme,
      applicantName: record.applicantName,
    });
  }
}

export const audioReceiptService = new AudioReceiptService();
