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
    const isChildCountEligible = input.livingChildrenCount <= 2;
    const isAgeEligible = input.motherAge === undefined || input.motherAge >= 19;

    const isEligible = isBPL && isChildCountEligible && isAgeEligible;

    // Karnataka Mathrushree Scheme: ₹1,000/month for 6 months = ₹6,000 total DBT
    const monthlyRate = 1000;
    const totalEntitlement = 6000;

    let messageKn = 'ಮಾತೃಶ್ರೀ ಯೋಜನೆ: ಗರ್ಭಿಣಿ ಮತ್ತು ಬಾಣಂತಿಯರಿಗೆ ಮಾಸಿಕ ₹1,000 ನೇರ ನಗದು ವರ್ಗಾವಣೆ (ಒಟ್ಟು ₹6,000) ಲಭ್ಯವಿದೆ.';
    let messageEn = 'Mathrushree Scheme: ₹1,000 monthly DBT entitlement (total ₹6,000 across 6 months) available for maternal nutrition.';

    if (!isBPL) {
      messageKn = 'ಮಾತೃಶ್ರೀ ಯೋಜನೆಗೆ ಬಿಪಿಎಲ್ ಅಥವಾ ಅಂತ್ಯೋದಯ (AAY) ರೇಷನ್ ಕಾರ್ಡ್ ಕಡ್ಡಾಯವಾಗಿದೆ.';
      messageEn = 'Mathrushree Scheme requires an eligible BPL/AAY ration card.';
    } else if (!isChildCountEligible) {
      messageKn = 'ಮಾತೃಶ್ರೀ ಯೋಜನೆಯು ಮೊದಲ 2 ಜೀವಂತ ಮಕ್ಕಳಿಗೆ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ.';
      messageEn = 'Mathrushree Scheme benefits are restricted up to the first 2 living children.';
    } else if (!isAgeEligible) {
      messageKn = 'ಮಾತೃಶ್ರೀ ಯೋಜನೆಗೆ ತಾಯಿಯ ವಯಸ್ಸು ಕನಿಷ್ಠ 19 ವರ್ಷವಾಗಿರಬೇಕು.';
      messageEn = 'Mathrushree Scheme requires the applicant mother to be at least 19 years old.';
    }

    return {
      isEligible,
      monthlyAllowanceInr: isEligible ? monthlyRate : 0,
      totalEntitlementInr: isEligible ? totalEntitlement : 0,
      trimesterPhase: input.pregnancyTrimester,
      disbursementMode: 'DIRECT_BENEFIT_TRANSFER',
      angawadiVerificationRequired: true,
      messageKn,
      messageEn,
    };
  }
}

export const mathrushreeService = new MathrushreeService();
