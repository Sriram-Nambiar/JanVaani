import type { ArogyaEligibilityInput } from '../schemas/arogya.js';

export interface ArogyaEligibilityResult {
  isEligible: boolean;
  category: 'A' | 'B';
  annualCoverageLimitInr: number;
  cashlessCoveragePercent: number;
  referralRequired: boolean;
  empanelledHospitalsCount: number;
  messageKn: string;
  messageEn: string;
}

export class ArogyaKarnatakaService {
  calculateEligibility(input: ArogyaEligibilityInput): ArogyaEligibilityResult {
    const isIncomeBPL =
      typeof input.annualIncomeInr === 'number' &&
      input.annualIncomeInr >= 0 &&
      input.annualIncomeInr <= 150000;

    const isBPL = input.rationCardType === 'BPL' || input.rationCardType === 'AAY' || isIncomeBPL;

    if (isBPL) {
      return {
        isEligible: true,
        category: 'A',
        annualCoverageLimitInr: 500000,
        cashlessCoveragePercent: 100,
        referralRequired: input.treatmentType !== 'SIMPLE_SECONDARY',
        empanelledHospitalsCount: 520,
        messageKn: 'ಆರೋಗ್ಯ ಕರ್ನಾಟಕ - ವರ್ಗ A: ಬಿಪಿಎಲ್ ಕುಟುಂಬಗಳಿಗೆ ವಾರ್ಷಿಕ ₹5,00,000 ವರೆಗೆ ಸಂಪೂರ್ಣ ಉಚಿತ ಚಿಕಿತ್ಸೆ ಲಭ್ಯವಿದೆ.',
        messageEn: 'Arogya Karnataka - Category A: Up to ₹5,00,000 cashless tertiary coverage available for BPL cardholders.',
      };
    } else {
      return {
        isEligible: true,
        category: 'B',
        annualCoverageLimitInr: 150000,
        cashlessCoveragePercent: 30,
        referralRequired: true,
        empanelledHospitalsCount: 380,
        messageKn: 'ಆರೋಗ್ಯ ಕರ್ನಾಟಕ - ವರ್ಗ B: ಎಪಿಎಲ್ ಕುಟುಂಬಗಳಿಗೆ ಶೇಕಡಾ 30 ರಿಯಾಯಿತಿ (ಗರಿಷ್ಠ ₹1,50,000) ದೊರೆಯುತ್ತದೆ.',
        messageEn: 'Arogya Karnataka - Category B: 30% co-payment assistance (maximum ₹1,50,000) available for general category.',
      };
    }
  }
}

export const arogyaService = new ArogyaKarnatakaService();
