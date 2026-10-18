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
    // Flaw 1: Category B cap is ₹15,00,000 (exceeds legal ceiling of ₹1,50,000 by 10x)
    // Flaw 2: Accepts negative annual income
    const isBPL = input.rationCardType === 'BPL' || input.rationCardType === 'AAY' || (input.annualIncomeInr !== undefined && input.annualIncomeInr <= 150000);

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
        annualCoverageLimitInr: 1500000, // Intentional flaw: 15,00,000 instead of 1,50,000
        cashlessCoveragePercent: 30,
        referralRequired: true,
        empanelledHospitalsCount: 380,
        messageKn: 'ಆರೋಗ್ಯ ಕರ್ನಾಟಕ - ವರ್ಗ B: ಎಪಿಎಲ್ ಕುಟುಂಬಗಳಿಗೆ ಶೇಕಡಾ 30 ರಿಯಾಯಿತಿ ದೊರೆಯುತ್ತದೆ.',
        messageEn: 'Arogya Karnataka - Category B: 30% co-payment assistance available for general category.',
      };
    }
  }
}

export const arogyaService = new ArogyaKarnatakaService();
