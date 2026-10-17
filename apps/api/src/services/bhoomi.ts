import crypto from 'node:crypto';
import { BhoomiRtcFetchInput } from '../schemas/bhoomi.js';
import { sarvamService } from './sarvam.js';
import { maskApplicantName } from './tracker.js';

export interface BhoomiRtcRecord {
  rtcNumber: string;
  district: string;
  taluk: string;
  hobli: string;
  village: string;
  surveyNumber: string;
  hissaNumber: string;
  ownerNameMaskedKn: string;
  ownerNameMaskedEn: string;
  landType: 'DRY' | 'WET' | 'GARDEN';
  landTypeKn: string;
  extentAcres: number;
  extentGuntas: number;
  mutationStatus: 'APPROVED' | 'PENDING';
  encumbranceFree: boolean;
  issuedAt: string;
  spokenSummaryKn: string;
  spokenSummaryEn: string;
  audioBase64?: string;
}

export class BhoomiService {
  private demoRecords = new Map<string, BhoomiRtcRecord>([
    [
      'BHOOMI-BLR-DEV-2026-S102',
      {
        rtcNumber: 'BHOOMI-BLR-DEV-2026-S102',
        district: 'Bengaluru Rural',
        taluk: 'Devanahalli',
        hobli: 'Kasaba',
        village: 'Koramangala',
        surveyNumber: '102',
        hissaNumber: '1',
        ownerNameMaskedKn: 'ಮಂಜುನಾಥ ಗೌಡ (Manjunatha Gowda)',
        ownerNameMaskedEn: 'M*** G***',
        landType: 'DRY',
        landTypeKn: 'ಖುಷ್ಕಿ (Dry Land)',
        extentAcres: 2,
        extentGuntas: 20,
        mutationStatus: 'APPROVED',
        encumbranceFree: true,
        issuedAt: '2026-04-10T09:30:00.000Z',
        spokenSummaryKn:
          'ಭೂಮಿ ಪಹಣಿ ದೃಢೀಕರಣ: ದೇವನಹಳ್ಳಿ ತಾಲೂಕಿನ ಸರ್ವೆ ನಂಬರ್ 102/1 ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ 2 ಎಕರೆ 20 ಗುಂಟೆ. ಮ್ಯುಟೇಶನ್ ಅನುಮೋದನೆಗೊಂಡಿದ್ದು ಯಾವುದೇ ಹೊಣೆಗಾರಿಕೆ ಇರುವುದಿಲ್ಲ.',
        spokenSummaryEn:
          'Bhoomi RTC Verified: Survey No 102/1 in Devanahalli Taluk covers 2 Acres 20 Guntas dry land. Mutation approved with clean encumbrance-free title.',
      },
    ],
  ]);

  public async fetchRtc(input: BhoomiRtcFetchInput): Promise<BhoomiRtcRecord> {
    const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
    const rtcNumber = `BHOOMI-KAR-2026-${entropy}`;
    const issuedAt = new Date().toISOString();

    const ownerNameKn = 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)';
    const ownerNameMaskedKn = maskApplicantName(ownerNameKn);
    const ownerNameMaskedEn = 'S*** K***';

    const landType = 'DRY';
    const landTypeKn = 'ಖುಷ್ಕಿ (Dry Land)';
    const extentAcres = 1;
    const extentGuntas = 30;

    const spokenSummaryKn = `ಭೂಮಿ ಪಹಣಿ ಮಾಹಿತಿ: ${input.taluk} ತಾಲೂಕಿನ ${input.village} ಗ್ರಾಮದ ಸರ್ವೆ ನಂಬರ್ ${input.surveyNumber}/${input.hissaNumber} ರ ಜಮೀನು ${ownerNameMaskedKn} ಅವರ ಹೆಸರಿನಲ್ಲಿದೆ. ವಿಸ್ತೀರ್ಣ ${extentAcres} ಎಕರೆ ${extentGuntas} ಗುಂಟೆ. ಮ್ಯುಟೇಶನ್ ಕ್ರಿಯೆ ಅನುಮೋದನೆಗೊಂಡಿದೆ.`;
    const spokenSummaryEn = `Bhoomi RTC Pahani: Survey No ${input.surveyNumber}/${input.hissaNumber} in ${input.village}, ${input.taluk} is registered to ${ownerNameMaskedKn} with extent ${extentAcres} Acres ${extentGuntas} Guntas.`;

    let audioBase64: string | undefined;
    try {
      const tts = await sarvamService.textToSpeech(spokenSummaryKn, 'kn-IN');
      audioBase64 = tts.audioBase64;
    } catch {
      audioBase64 = undefined;
    }

    const record: BhoomiRtcRecord = {
      rtcNumber,
      district: input.district,
      taluk: input.taluk,
      hobli: input.hobli,
      village: input.village,
      surveyNumber: input.surveyNumber,
      hissaNumber: input.hissaNumber,
      ownerNameMaskedKn,
      ownerNameMaskedEn,
      landType,
      landTypeKn,
      extentAcres,
      extentGuntas,
      mutationStatus: 'APPROVED',
      encumbranceFree: true,
      issuedAt,
      spokenSummaryKn,
      spokenSummaryEn,
      audioBase64,
    };

    if (this.demoRecords.size >= 100) {
      const oldestKey = this.demoRecords.keys().next().value;
      if (oldestKey) this.demoRecords.delete(oldestKey);
    }
    this.demoRecords.set(rtcNumber, record);
    return record;
  }

  public lookupRtc(rtcNumber: string): BhoomiRtcRecord | null {
    const key = rtcNumber.trim().toUpperCase();
    return this.demoRecords.get(key) || null;
  }
}

export const bhoomiService = new BhoomiService();
