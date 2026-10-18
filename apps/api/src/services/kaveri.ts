import type { KaveriCalculateInput } from '../schemas/kaveri.js';

export interface KaveriValuationResult {
  chargeableMarketValueInr: number;
  minimumGuidanceValueInr: number;
  isConsiderationHigher: boolean;
  stampDutyRatePercent: number;
  stampDutyInr: number;
  infrastructureCessInr: number;
  localBodySurchargeInr: number;
  registrationFeeInr: number;
  totalPayableInr: number;
  transactionType: string;
  propertyType: string;
  urbanLocalBody: string;
  subRegistrarOffice: string;
  district: string;
  messageKn: string;
  messageEn: string;
}

export class KaveriService {
  calculateValuationAndDuty(input: KaveriCalculateInput): KaveriValuationResult {
    const minimumGuidanceValueInr = Math.round(input.areaSqFt * input.guidanceValuePerSqFt);
    const declared = input.declaredConsiderationInr || 0;
    const isConsiderationHigher = declared > minimumGuidanceValueInr;
    const chargeableMarketValueInr = Math.max(declared, minimumGuidanceValueInr);

    let stampDutyRatePercent = 5.0;
    let stampDutyInr = 0;
    let registrationFeeInr = 0;

    if (input.transactionType === 'GIFT_FAMILY') {
      // Karnataka Stamp Act Schedule: Concessional flat duty for gift deeds among blood relatives
      stampDutyRatePercent = 0.0;
      stampDutyInr = 1000;
      registrationFeeInr = 1000;
    } else if (input.transactionType === 'MORTGAGE') {
      stampDutyRatePercent = 0.5;
      stampDutyInr = Math.round(chargeableMarketValueInr * 0.005);
      registrationFeeInr = Math.round(chargeableMarketValueInr * 0.01);
    } else if (input.transactionType === 'LEASE') {
      stampDutyRatePercent = 2.0;
      stampDutyInr = Math.round(chargeableMarketValueInr * 0.02);
      registrationFeeInr = Math.round(chargeableMarketValueInr * 0.01);
    } else if (input.transactionType === 'SALE') {
      const isResidential =
        input.propertyType === 'RESIDENTIAL_APARTMENT' || input.propertyType === 'RESIDENTIAL_PLOT';

      if (isResidential && chargeableMarketValueInr <= 2_000_000) {
        // Affordable housing slab: 2%
        stampDutyRatePercent = 2.0;
      } else if (isResidential && chargeableMarketValueInr <= 4_500_000) {
        // Mid-segment housing slab: 3%
        stampDutyRatePercent = 3.0;
      } else {
        // Standard rate: 5%
        stampDutyRatePercent = 5.0;
      }

      stampDutyInr = Math.round(chargeableMarketValueInr * (stampDutyRatePercent / 100));
      registrationFeeInr = Math.round(chargeableMarketValueInr * 0.01);
    } else {
      // GIFT_NON_FAMILY or standard conveyance
      stampDutyRatePercent = 5.0;
      stampDutyInr = Math.round(chargeableMarketValueInr * 0.05);
      registrationFeeInr = Math.round(chargeableMarketValueInr * 0.01);
    }

    // Infrastructure Cess: 10% on Stamp Duty
    const infrastructureCessInr = Math.round(stampDutyInr * 0.10);

    // Urban Local Body Surcharge: 2% in urban/BBMP, 3% in rural/panchayats
    const isRural =
      input.urbanLocalBody === 'GRAM_PANCHAYAT' || input.urbanLocalBody === 'TOWN_PANCHAYAT';
    const surchargeRate = isRural ? 0.03 : 0.02;
    const localBodySurchargeInr = Math.round(stampDutyInr * surchargeRate);

    const totalPayableInr =
      stampDutyInr + infrastructureCessInr + localBodySurchargeInr + registrationFeeInr;

    const messageKn = `ಕಾವೇರಿ ೨.೦ ಮೌಲ್ಯಮಾಪನ: ಒಟ್ಟು ಆಸ್ತಿ ಮೌಲ್ಯ ₹${chargeableMarketValueInr.toLocaleString('en-IN')}. ಮುದ್ರಾಂಕ ಶುಲ್ಕ (${stampDutyRatePercent}%): ₹${stampDutyInr.toLocaleString('en-IN')}, ನೋಂದಣಿ ಶುಲ್ಕ: ₹${registrationFeeInr.toLocaleString('en-IN')}, ಸೆಸ್ ಮತ್ತು ಸರ್‌ಚಾರ್ಜ್: ₹${(infrastructureCessInr + localBodySurchargeInr).toLocaleString('en-IN')}. ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ: ₹${totalPayableInr.toLocaleString('en-IN')}.`;

    const messageEn = `Kaveri 2.0 Valuation: Chargeable market value ₹${chargeableMarketValueInr.toLocaleString('en-IN')}. Stamp duty (${stampDutyRatePercent}%): ₹${stampDutyInr.toLocaleString('en-IN')}, Registration fee: ₹${registrationFeeInr.toLocaleString('en-IN')}, Cess & Surcharges: ₹${(infrastructureCessInr + localBodySurchargeInr).toLocaleString('en-IN')}. Total payable: ₹${totalPayableInr.toLocaleString('en-IN')}.`;

    return {
      chargeableMarketValueInr,
      minimumGuidanceValueInr,
      isConsiderationHigher,
      stampDutyRatePercent,
      stampDutyInr,
      infrastructureCessInr,
      localBodySurchargeInr,
      registrationFeeInr,
      totalPayableInr,
      transactionType: input.transactionType,
      propertyType: input.propertyType,
      urbanLocalBody: input.urbanLocalBody,
      subRegistrarOffice: input.subRegistrarOffice,
      district: input.district,
      messageKn,
      messageEn,
    };
  }
}

export const kaveriService = new KaveriService();
