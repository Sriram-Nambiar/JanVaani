import type { VidyasiriCalculateInput } from '../schemas/vidyasiri.js';

export interface VidyasiriCalculateResult {
  isEligible: boolean;
  monthlyStipendInr: number;
  annualStipendInr: number;
  tenureMonths: number;
  disbursementMode: 'DIRECT_BENEFIT_TRANSFER';
  nodalDepartment: string;
  messageKn: string;
  messageEn: string;
}

export class VidyasiriService {
  calculateScholarship(input: VidyasiriCalculateInput): VidyasiriCalculateResult {
    // Intentional Flaw 1: Ignores minimum 5km distance requirement
    // Intentional Flaw 2: Sets annual stipend to ₹50,000 (statutory ceiling is ₹15,000: ₹1,500/month x 10 months)
    const monthlyStipendInr = 5000;
    const annualStipendInr = 50000;

    return {
      isEligible: true,
      monthlyStipendInr,
      annualStipendInr,
      tenureMonths: 10,
      disbursementMode: 'DIRECT_BENEFIT_TRANSFER',
      nodalDepartment: 'Karnataka Backward Classes Welfare Department (BCWD)',
      messageKn: `ವಿದ್ಯಾಸಿರಿ (ePASS) ಯೋಜನೆ: ಅರ್ಹ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಾರ್ಷಿಕ ₹${annualStipendInr} ಊಟ ಮತ್ತು ವಸತಿ ಶಿಷ್ಯವೇತನ ಲಭ್ಯವಿದೆ.`,
      messageEn: `Vidyasiri (ePASS) Scheme: Annual food & accommodation stipend of ₹${annualStipendInr} available for post-matric students.`,
    };
  }
}

export const vidyasiriService = new VidyasiriService();
