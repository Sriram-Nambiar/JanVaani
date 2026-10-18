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
    // Karnataka Backward Classes Welfare Department (BCWD) Vidyasiri FAS criteria:
    // 1. Must be from Backward Classes (Cat-1, 2A, 2B, 3A, 3B, SC, ST); GENERAL is not eligible.
    // 2. Minimum distance between permanent residence and college must be >= 5 km.
    // 3. Must not already be residing in a government student hostel.
    // 4. Annual income ceiling: Cat-1/SC/ST <= ₹2,50,000; Cat-2A/2B/3A/3B <= ₹1,00,000.
    // 5. Statutory entitlement: ₹1,500/month for 10 months = ₹15,000 per academic year.

    const isCategoryEligible = input.casteCategory !== 'GENERAL';
    const isDistanceEligible = input.distanceKm >= 5;
    const isNotHostelite = !input.residingInGovtHostel;

    let incomeCeiling = 100000;
    if (input.casteCategory === 'CAT_1' || input.casteCategory === 'SC' || input.casteCategory === 'ST') {
      incomeCeiling = 250000;
    }
    const isIncomeEligible = input.annualFamilyIncomeInr <= incomeCeiling;

    const isEligible = isCategoryEligible && isDistanceEligible && isNotHostelite && isIncomeEligible;

    const monthlyStipendInr = isEligible ? 1500 : 0;
    const annualStipendInr = isEligible ? 15000 : 0;

    let messageKn = `ವಿದ್ಯಾಸಿರಿ (FAS) ಯೋಜನೆ: ಅರ್ಹ ಹಿಂದುಳಿದ ವರ್ಗಗಳ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮಾಸಿಕ ₹1,500 (ವಾರ್ಷಿಕ ₹15,000) ಊಟ ಮತ್ತು ವಸತಿ ಶಿಷ್ಯವೇತನ ಲಭ್ಯವಿದೆ.`;
    let messageEn = `Vidyasiri (FAS) Scheme: ₹1,500 monthly stipend (annual ₹15,000 across 10 months) available for food and accommodation.`;

    if (!isCategoryEligible) {
      messageKn = `ವಿದ್ಯಾಸಿರಿ ಯೋಜನೆಯು ಹಿಂದುಳಿದ ವರ್ಗಗಳು (Cat-1, 2A, 2B, 3A, 3B, SC/ST) ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ.`;
      messageEn = `Vidyasiri Scheme is restricted to eligible Backward Classes and SC/ST students.`;
    } else if (!isDistanceEligible) {
      messageKn = `ವಿದ್ಯಾಸಿರಿ ಯೋಜನೆಯ ನಿಯಮದಂತೆ ಮನೆಯಿಂದ ಕಾಲೇಜಿಗೆ ಕನಿಷ್ಠ 5 ಕಿ.ಮೀ ದೂರವಿರಬೇಕು (ಪ್ರಸ್ತುತ: ${input.distanceKm} ಕಿ.ಮೀ).`;
      messageEn = `Vidyasiri Scheme requires a minimum distance of 5 km from residence to college (current: ${input.distanceKm} km).`;
    } else if (!isNotHostelite) {
      messageKn = `ಸರ್ಕಾರಿ ವಸತಿ ನಿಲಯಗಳಲ್ಲಿ ಪ್ರವೇಶ ಪಡೆದ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿದ್ಯಾಸಿರಿ ಭತ್ಯೆ ಲಭ್ಯವಿರುವುದಿಲ್ಲ.`;
      messageEn = `Students residing in government departmental hostels are not eligible for Vidyasiri stipend.`;
    } else if (!isIncomeEligible) {
      messageKn = `ನಿಮ್ಮ ಜಾತಿ ವರ್ಗಕ್ಕೆ ನಿಗದಿಪಡಿಸಿದ ವಾರ್ಷಿಕ ಆದಾಯ ಮಿತಿ ₹${incomeCeiling} ಮೀರಿದೆ.`;
      messageEn = `Family income exceeds the statutory ceiling of ₹${incomeCeiling} for your category.`;
    }

    return {
      isEligible,
      monthlyStipendInr,
      annualStipendInr,
      tenureMonths: 10,
      disbursementMode: 'DIRECT_BENEFIT_TRANSFER',
      nodalDepartment: 'Karnataka Backward Classes Welfare Department (BCWD)',
      messageKn,
      messageEn,
    };
  }
}

export const vidyasiriService = new VidyasiriService();
