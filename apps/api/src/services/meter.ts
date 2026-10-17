import { MeterCalculationInput } from '../schemas/meter.js';
import { sarvamService } from './sarvam.js';

export interface MeterSubsidyResult {
  rrNumber: string;
  escomName: string;
  consumedUnits: number;
  entitlementLimitUnits: number;
  isZeroBillEligible: boolean;
  chargeableUnits: number;
  subsidyRatePerUnit: number;
  subsidyAmountSaved: number;
  netPayableAmount: number;
  spokenExplanationKn: string;
  spokenExplanationEn: string;
  audioBase64?: string;
}

export class MeterSubsidyService {
  private demoRecords = new Map<string, { previousReading: number; currentReading: number; escomName: string; avgUnits: number }>([
    ['BESCOM-W1-4029', { previousReading: 1240, currentReading: 1390, escomName: 'BESCOM', avgUnits: 160 }],
    ['HESCOM-HD-8102', { previousReading: 2100, currentReading: 2320, escomName: 'HESCOM', avgUnits: 180 }],
  ]);

  public calculate(input: MeterCalculationInput): Omit<MeterSubsidyResult, 'audioBase64'> {
    const previous = input.previousReading;
    const current = input.currentReading;

    if (current < previous) {
      throw new Error('Current reading cannot be lower than previous reading');
    }

    const consumedUnits = Math.round((current - previous) * 10) / 10;
    const avgUnits = input.averageMonthlyUnits ?? 150;
    // Karnataka Govt formula: avg consumption + 10% entitlement buffer, capped at 200 units
    const entitlementLimitUnits = Math.min(200, Math.round(avgUnits * 1.1));

    const subsidyRatePerUnit = 7.0; // Standard Karnataka domestic electricity tariff rate (~₹7/unit)

    let isZeroBillEligible = false;
    let chargeableUnits = 0;
    let netPayableAmount = 0;
    let subsidyAmountSaved = 0;

    if (consumedUnits <= entitlementLimitUnits) {
      isZeroBillEligible = true;
      chargeableUnits = 0;
      netPayableAmount = 0;
      subsidyAmountSaved = Math.round(consumedUnits * subsidyRatePerUnit);
    } else {
      isZeroBillEligible = false;
      chargeableUnits = Math.round((consumedUnits - entitlementLimitUnits) * 10) / 10;
      netPayableAmount = Math.round(chargeableUnits * subsidyRatePerUnit);
      subsidyAmountSaved = Math.round(entitlementLimitUnits * subsidyRatePerUnit);
    }

    const spokenExplanationKn = isZeroBillEligible
      ? `ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ${input.escomName} ಮೀಟರ್ ${input.rrNumber} ನಲ್ಲಿ ಒಟ್ಟು ${consumedUnits} ಯೂನಿಟ್ ಬಳಕೆಯಾಗಿದೆ. ನಿಮ್ಮ ಗೃಹ ಜ್ಯೋತಿ ಮಿತಿ ${entitlementLimitUnits} ಯೂನಿಟ್ ಆಗಿದ್ದು, ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿದೆ. ನಿಮ್ಮ ಈ ತಿಂಗಳ ಬಿಲ್ ಶೂನ್ಯ ಬಿಲ್ (₹0 Zero Bill). ಸರ್ಕಾರದಿಂದ ₹${subsidyAmountSaved} ಉಳಿತಾಯವಾಗಿದೆ.`
      : `ಗಮನಿಸಿ: ನಿಮ್ಮ ${input.escomName} ಮೀಟರ್ ${input.rrNumber} ನಲ್ಲಿ ಒಟ್ಟು ${consumedUnits} ಯೂನಿಟ್ ಬಳಕೆಯಾಗಿದೆ. ಉಚಿತ ಮಿತಿ ${entitlementLimitUnits} ಯೂನಿಟ್‌ಗಿಂತ ${chargeableUnits} ಯೂನಿಟ್ ಹೆಚ್ಚಾಗಿದೆ. ಕೇವಲ ಹೆಚ್ಚುವರಿ ಯೂನಿಟ್‌ಗಳಿಗೆ ₹${netPayableAmount} ಪಾವತಿಸಬೇಕಾಗುತ್ತದೆ.`;

    const spokenExplanationEn = isZeroBillEligible
      ? `Congratulations! Your net consumption is ${consumedUnits} units under ${input.escomName} RR No ${input.rrNumber}. Within your Gruha Jyothi quota of ${entitlementLimitUnits} units. Your net payable bill is ₹0 Zero Bill.`
      : `Notice: Consumption is ${consumedUnits} units exceeding free quota of ${entitlementLimitUnits} units. Net payable for excess ${chargeableUnits} units is ₹${netPayableAmount}.`;

    return {
      rrNumber: input.rrNumber.toUpperCase(),
      escomName: input.escomName,
      consumedUnits,
      entitlementLimitUnits,
      isZeroBillEligible,
      chargeableUnits,
      subsidyRatePerUnit,
      subsidyAmountSaved,
      netPayableAmount,
      spokenExplanationKn,
      spokenExplanationEn,
    };
  }

  public async calculateWithAudio(input: MeterCalculationInput): Promise<MeterSubsidyResult> {
    const result = this.calculate(input);
    let audioBase64: string | undefined;
    try {
      const tts = await sarvamService.textToSpeech(result.spokenExplanationKn, 'kn-IN');
      audioBase64 = tts.audioBase64;
    } catch {
      audioBase64 = undefined;
    }

    return {
      ...result,
      audioBase64,
    };
  }

  public lookupDemo(rrNumber: string): MeterCalculationInput | null {
    const key = rrNumber.trim().toUpperCase();
    const demo = this.demoRecords.get(key);
    if (!demo) return null;
    return {
      rrNumber: key,
      escomName: demo.escomName as any,
      previousReading: demo.previousReading,
      currentReading: demo.currentReading,
      averageMonthlyUnits: demo.avgUnits,
    };
  }
}

export const meterSubsidyService = new MeterSubsidyService();
