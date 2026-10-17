import { AnnaBhagyaCalculateInput } from '../schemas/annabhagya.js';
import { sarvamService } from './sarvam.js';
import { maskApplicantName, maskId } from './tracker.js';

export interface AnnaBhagyaEntitlementResult {
  rationCardNumberMasked: string;
  headOfFamilyMasked: string;
  cardType: string;
  memberCount: number;
  isEligible: boolean;
  freeRiceKg: number;
  dbtCashPerMonth: number;
  ratePerKg: number;
  dbtStatus: 'ACTIVE' | 'ACTION_REQUIRED' | 'NOT_ELIGIBLE';
  dbtStatusKn: string;
  dbtStatusEn: string;
  district: string;
  spokenExplanationKn: string;
  spokenExplanationEn: string;
  audioBase64?: string;
}

export class AnnaBhagyaService {
  private demoCards = new Map<string, AnnaBhagyaEntitlementResult>([
    [
      'RC-KAR-BPL-8821',
      {
        rationCardNumberMasked: '********8821',
        headOfFamilyMasked: 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)',
        cardType: 'BPL',
        memberCount: 4,
        isEligible: true,
        freeRiceKg: 20,
        dbtCashPerMonth: 680,
        ratePerKg: 34,
        dbtStatus: 'ACTIVE',
        dbtStatusKn: 'ಡಿಬಿಟಿ ಖಾತೆ ಸಕ್ರಿಯವಾಗಿದೆ (DBT Active)',
        dbtStatusEn: 'Aadhaar-seeded bank account active for DBT transfer',
        district: 'Bengaluru Urban',
        spokenExplanationKn:
          'ಅನ್ನಭಾಗ್ಯ ಯೋಜನೆಯಡಿ ನಿಮ್ಮ ಬಿಪಿಎಲ್ ಕಾರ್ಡ್‌ಗೆ ತಿಂಗಳಿಗೆ 20 ಕೆಜಿ ಉಚಿತ ಅಕ್ಕಿ ಮತ್ತು ನೇರ ನಗದು ವರ್ಗಾವಣೆ (ಡಿಬಿಟಿ) ಮೂಲಕ ₹680 ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆಯಾಗಲಿದೆ.',
        spokenExplanationEn:
          'Under Karnataka Anna Bhagya Scheme, your BPL family receives 20 kg free foodgrains and ₹680 monthly DBT cash directly to your Aadhaar-linked bank account.',
      },
    ],
  ]);

  public async calculateEntitlement(
    input: AnnaBhagyaCalculateInput
  ): Promise<AnnaBhagyaEntitlementResult> {
    const isEligible = input.cardType === 'BPL' || input.cardType === 'AAY';
    const ratePerKg = 34;
    const freeRiceKg = isEligible ? input.memberCount * 5 : 0;
    const dbtCashPerMonth = isEligible ? input.memberCount * 5 * ratePerKg : 0;

    let dbtStatus: 'ACTIVE' | 'ACTION_REQUIRED' | 'NOT_ELIGIBLE' = 'NOT_ELIGIBLE';
    let dbtStatusKn = 'ಅರ್ಹತೆ ಹೊಂದಿಲ್ಲ (APL Non-Priority)';
    let dbtStatusEn = 'Ineligible for Anna Bhagya subsidy (APL cardholder)';

    if (isEligible) {
      if (input.dbtBankLinked) {
        dbtStatus = 'ACTIVE';
        dbtStatusKn = 'ಡಿಬಿಟಿ ಖಾತೆ ಸಕ್ರಿಯವಾಗಿದೆ (ಆಧಾರ್ ಜೋಡಣೆ ಪೂರ್ಣ)';
        dbtStatusEn = 'Aadhaar-seeded bank account is active for direct DBT transfer';
      } else {
        dbtStatus = 'ACTION_REQUIRED';
        dbtStatusKn = 'ಗಮನಿಸಿ: ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಆಧಾರ್ NPCI ಮ್ಯಾಪಿಂಗ್ ಕಡ್ಡಾಯವಾಗಿದೆ';
        dbtStatusEn = 'Action required: Link Aadhaar to bank account via NPCI for DBT credit';
      }
    }

    const headOfFamilyMasked = maskApplicantName(input.headOfFamilyName);
    const rationCardNumberMasked = maskId(input.rationCardNumber);

    const spokenExplanationKn = isEligible
      ? `ಅನ್ನಭಾಗ್ಯ ಯೋಜನೆಯಡಿ ${headOfFamilyMasked} ಅವರ ಕುಟುಂಬಕ್ಕೆ ಮಾಸಿಕ ${freeRiceKg} ಕೆಜಿ ಉಚಿತ ಅಕ್ಕಿ ಲಭ್ಯವಿದೆ. ಹೆಚ್ಚುವರಿ 5 ಕೆಜಿ ಅಕ್ಕಿಯ ಬದಲಾಗಿ ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ ₹170 ರಂತೆ ಒಟ್ಟು ₹${dbtCashPerMonth} ನೇರ ನಗದು ವರ್ಗಾವಣೆ (DBT) ಮೂಲಕ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆಯಾಗಲಿದೆ.`
      : `ಗಮನಿಸಿ: ನಿಮ್ಮ ಪಡಿತರ ಚೀಟಿ APL ವರ್ಗದಲ್ಲಿದ್ದು, ಅನ್ನಭಾಗ್ಯ ಉಚಿತ ಅಕ್ಕಿ ಹಾಗೂ ನಗದು ಸೌಲಭ್ಯಕ್ಕೆ ಅರ್ಹವಾಗಿರುವುದಿಲ್ಲ.`;

    const spokenExplanationEn = isEligible
      ? `Under Karnataka Anna Bhagya Scheme, your household receives ${freeRiceKg} kg free rice and ₹${dbtCashPerMonth} monthly DBT cash transfer (@ ₹34/kg for 5 kg/person).`
      : `Notice: APL ration card is not eligible for Karnataka Anna Bhagya grain subsidy or DBT cash-in-lieu.`;

    let audioBase64: string | undefined;
    try {
      const tts = await sarvamService.textToSpeech(spokenExplanationKn, 'kn-IN');
      audioBase64 = tts.audioBase64;
    } catch {
      audioBase64 = undefined;
    }

    const result: AnnaBhagyaEntitlementResult = {
      rationCardNumberMasked,
      headOfFamilyMasked,
      cardType: input.cardType,
      memberCount: input.memberCount,
      isEligible,
      freeRiceKg,
      dbtCashPerMonth,
      ratePerKg,
      dbtStatus,
      dbtStatusKn,
      dbtStatusEn,
      district: input.district,
      spokenExplanationKn,
      spokenExplanationEn,
      audioBase64,
    };

    this.demoCards.set(input.rationCardNumber.trim().toUpperCase(), result);
    return result;
  }

  public lookupCard(rcNumber: string): AnnaBhagyaEntitlementResult | null {
    const key = rcNumber.trim().toUpperCase();
    return this.demoCards.get(key) || null;
  }
}

export const annaBhagyaService = new AnnaBhagyaService();
