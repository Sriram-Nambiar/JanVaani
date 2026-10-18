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
    // Karnataka Sandhya Suraksha / SSP statutory rules:
    // 1. Age must be at least 65 years.
    // 2. Combined family income must be <= ₹20,000 (rural) or <= ₹24,000 (urban), or holding BPL/AAY card.
    // 3. Monthly statutory pension is ₹1,200/month.
    const isAgeEligible = input.age >= 65;

    const incomeThreshold = input.areaType === 'RURAL' ? 20000 : 24000;
    const isIncomeEligible =
      input.rationCardType === 'BPL' ||
      input.rationCardType === 'AAY' ||
      (input.annualIncomeInr !== undefined && input.annualIncomeInr <= incomeThreshold);

    const isEligible = isAgeEligible && isIncomeEligible;
    const monthlyPensionInr = isEligible ? 1200 : 0;

    let messageKn = `ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಯೋಜನೆ: 65 ವರ್ಷ ಮೇಲ್ಪಟ್ಟ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಮಾಸಿಕ ₹1,200 ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ ಲಭ್ಯವಿದೆ.`;
    let messageEn = `Sandhya Suraksha Scheme: Monthly pension of ₹1,200 available for senior citizens aged 65 and above.`;

    if (!isAgeEligible) {
      messageKn = `ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಯೋಜನೆಗೆ ಕನಿಷ್ಠ ವಯಸ್ಸು 65 ವರ್ಷವಾಗಿರಬೇಕು (ಪ್ರಸ್ತುತ ವಯಸ್ಸು: ${input.age}).`;
      messageEn = `Sandhya Suraksha Scheme requires an applicant to be at least 65 years of age (current age: ${input.age}).`;
    } else if (!isIncomeEligible) {
      messageKn = `ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಯೋಜನೆಗೆ ವಾರ್ಷಿಕ ಆದಾಯ ಮಿತಿ ₹${incomeThreshold} ಅಥವಾ ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಇರಬೇಕು.`;
      messageEn = `Sandhya Suraksha Scheme requires annual income within ₹${incomeThreshold} or an eligible BPL card.`;
    }

    return {
      isEligible,
      monthlyPensionInr,
      schemeCategory: 'SANDHYA_SURAKSHA',
      disbursementMode: 'DIRECT_BENEFIT_TRANSFER',
      sspOffice: `${input.district} Social Security and Pensions Office`,
      messageKn,
      messageEn,
    };
  }
}

export const sandhyaSurakshaService = new SandhyaSurakshaService();
