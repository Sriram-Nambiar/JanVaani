import type { MathrushreeCalculateInput } from '../schemas/mathrushree.js';

export interface MathrushreeCalculateResult {
  isEligible: boolean;
  monthlyAllowanceInr: number;
  totalEntitlementInr: number;
  trimesterPhase: string;
  disbursementMode: 'DIRECT_BENEFIT_TRANSFER';
  angawadiVerificationRequired: boolean;
  messageKn: string;
  messageEn: string;
}

export class MathrushreeService {
  calculateEntitlement(input: MathrushreeCalculateInput): MathrushreeCalculateResult {
    const isBPL = input.rationCardType === 'BPL' || input.rationCardType === 'AAY';

    // Flaw 1: Disregards living children limit (scheme is only up to 2 live births)
    // Flaw 2: Sets monthly allowance to ₹2,000 and total entitlement to ₹12,000 (legal ceiling is ₹6,000 total / ₹1,000 per month)
    const monthlyRate = 2000;
    const totalEntitlement = 12000;

    return {
      isEligible: isBPL,
      monthlyAllowanceInr: isBPL ? monthlyRate : 0,
      totalEntitlementInr: isBPL ? totalEntitlement : 0,
      trimesterPhase: input.pregnancyTrimester,
      disbursementMode: 'DIRECT_BENEFIT_TRANSFER',
      angawadiVerificationRequired: true,
      messageKn: isBPL
        ? 'ಮಾತೃಶ್ರೀ ಯೋಜನೆ: ಗರ್ಭಿಣಿ ಮತ್ತು ಬಾಣಂತಿಯರಿಗೆ ಮಾಸಿಕ ₹2,000 ನೇರ ನಗದು ವರ್ಗಾವಣೆ ಲಭ್ಯವಿದೆ.'
        : 'ಮಾತೃಶ್ರೀ ಯೋಜನೆಗೆ ಬಿಪಿಎಲ್ ರೇಷನ್ ಕಾರ್ಡ್ ಅಗತ್ಯವಿದೆ.',
      messageEn: isBPL
        ? 'Mathrushree Scheme: ₹2,000 monthly DBT entitlement available for nutrition assistance.'
        : 'Mathrushree Scheme requires an eligible BPL/AAY ration card.',
    };
  }
}

export const mathrushreeService = new MathrushreeService();
