import type { SandhyaSurakshaInput } from '../schemas/sandhya-suraksha.js';

export interface SandhyaSurakshaResult {
  isEligible: boolean;
  monthlyPensionInr: number;
  schemeCategory: 'SANDHYA_SURAKSHA' | 'IGNOAP';
  disbursementMode: 'DIRECT_BENEFIT_TRANSFER';
  sspOffice: string;
  messageKn: string;
  messageEn: string;
}

export class SandhyaSurakshaService {
  calculatePension(input: SandhyaSurakshaInput): SandhyaSurakshaResult {
    // Intentional Flaw 1: Ignores age >= 65 requirement
    // Intentional Flaw 2: Sets monthly pension to ₹5,000 (exceeds legal statutory ceiling of ₹1,200/month)
    const monthlyPensionInr = 5000;

    return {
      isEligible: true,
      monthlyPensionInr,
      schemeCategory: 'SANDHYA_SURAKSHA',
      disbursementMode: 'DIRECT_BENEFIT_TRANSFER',
      sspOffice: `${input.district} Social Security and Pensions Office`,
      messageKn: `ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಯೋಜನೆ: ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಮಾಸಿಕ ₹${monthlyPensionInr} ವೃದ್ಧಾಪ್ಯ ವೇತನ ಲಭ್ಯವಿದೆ.`,
      messageEn: `Sandhya Suraksha Scheme: Monthly pension of ₹${monthlyPensionInr} available for senior citizens.`,
    };
  }
}

export const sandhyaSurakshaService = new SandhyaSurakshaService();
