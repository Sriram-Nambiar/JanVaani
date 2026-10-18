import type { GruhaJyothiCalculateInput } from '../schemas/gruha-jyothi.js';

export interface GruhaJyothiCalculationResult {
  consumerId: string;
  escom: string;
  connectionType: string;
  sanctionedLoadKw: number;
  averageAnnualConsumptionUnits: number;
  currentMonthUnits: number;
  entitledUnits: number;
  isZeroBill: boolean;
  isDisqualified: boolean;
  grossBillInr: number;
  subsidyInr: number;
  netPayableInr: number;
  excessUnits: number;
  tariffPerUnitInr: number;
  fppcaPerUnitInr: number;
  fixedChargeInr: number;
  electricityTaxInr: number;
  messageKn: string;
  messageEn: string;
}

export class GruhaJyothiService {
  private readonly tariffPerUnit = 5.90;
  private readonly fixedRatePerKw = 110.0;
  private readonly fppcaRatePerUnit = 0.37;
  private readonly taxRate = 0.09;

  calculateBill(input: GruhaJyothiCalculateInput): GruhaJyothiCalculationResult {
    // Statutory entitlement: 12-month average + 10% buffer, capped at 200 units
    const bufferedUnits = Math.round(input.averageAnnualConsumptionUnits * 1.10);
    const entitledUnits = Math.min(200, Math.max(0, bufferedUnits));

    const currentUnits = input.currentMonthUnits;
    const fixedChargeInr = Math.round(input.sanctionedLoadKw * this.fixedRatePerKw);
    const energyChargeInr = Math.round(currentUnits * this.tariffPerUnit * 100) / 100;
    const fppcaInr = Math.round(currentUnits * this.fppcaRatePerUnit * 100) / 100;
    const electricityTaxInr = Math.round((energyChargeInr + fppcaInr) * this.taxRate * 100) / 100;

    const grossBillInr = Math.round(energyChargeInr + fixedChargeInr + fppcaInr + electricityTaxInr);

    let isZeroBill = false;
    let isDisqualified = false;
    let netPayableInr = 0;
    let subsidyInr = 0;
    let excessUnits = 0;

    let messageKn = '';
    let messageEn = '';

    if (currentUnits > 200) {
      // Disqualified for this billing cycle if usage exceeds 200 units
      isDisqualified = true;
      isZeroBill = false;
      netPayableInr = grossBillInr;
      subsidyInr = 0;
      excessUnits = currentUnits - entitledUnits;

      messageKn = `ಈ ತಿಂಗಳ ವಿದ್ಯುತ್ ಬಳಕೆ (${currentUnits} ಯೂನಿಟ್‌ಗಳು) ಗೃಹಜ್ಯೋತಿ ಯೋಜನೆಯ ೨೦೦ ಯೂನಿಟ್‌ಗಳ ಗರಿಷ್ಠ ಮಿತಿಯನ್ನು ಮೀರಿದೆ. ಸಂಪೂರ್ಣ ಬಿಲ್ ಮೊತ್ತ ₹${netPayableInr.toLocaleString('en-IN')} ಪಾವತಿಸಬೇಕಾಗುತ್ತದೆ.`;
      messageEn = `Consumption of ${currentUnits} units exceeds the statutory 200-unit ceiling under Gruha Jyothi. Full electricity bill of ₹${netPayableInr.toLocaleString('en-IN')} is payable without government subsidy.`;
    } else if (currentUnits <= entitledUnits) {
      // 100% Zero bill: government subsidizes the entire gross bill (energy + fixed + fppca + tax)
      isZeroBill = true;
      isDisqualified = false;
      netPayableInr = 0;
      subsidyInr = grossBillInr;
      excessUnits = 0;

      messageKn = `ಗೃಹಜ್ಯೋತಿ ಶೂನ್ಯ ಬಿಲ್! ನಿಮ್ಮ ಮಾಸಿಕ ಬಳಕೆ ${currentUnits} ಯೂನಿಟ್‌ಗಳು ನಿಮ್ಮ ಅರ್ಹ ಮಿತಿ (${entitledUnits} ಯೂನಿಟ್‌ಗಳು) ಒಳಗಿದೆ. ಸರ್ಕಾರ ಭರಿಸಿದ ಸಹಾಯಧನ: ₹${subsidyInr.toLocaleString('en-IN')}. ನೀವು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ: ₹0.`;
      messageEn = `Gruha Jyothi Zero Bill! Your consumption of ${currentUnits} units is within your entitled limit of ${entitledUnits} units. Total government subsidy applied: ₹${subsidyInr.toLocaleString('en-IN')}. Net payable: ₹0.`;
    } else {
      // Partial subsidy: entitledUnits are subsidized, while consumer pays for excess units plus fixed charges
      excessUnits = currentUnits - entitledUnits;
      const subsidizedEnergy = Math.round(entitledUnits * this.tariffPerUnit * 100) / 100;
      const subsidizedFppca = Math.round(entitledUnits * this.fppcaRatePerUnit * 100) / 100;
      const subsidizedTax = Math.round((subsidizedEnergy + subsidizedFppca) * this.taxRate * 100) / 100;

      subsidyInr = Math.round(subsidizedEnergy + subsidizedFppca + subsidizedTax);
      netPayableInr = Math.max(0, grossBillInr - subsidyInr);
      isZeroBill = false;
      isDisqualified = false;

      messageKn = `ಗೃಹಜ್ಯೋತಿ ಭಾಗಶಃ ಸಹಾಯಧನ ಅನ್ವಯಿಸಿದೆ. ${entitledUnits} ಯೂನಿಟ್‌ಗಳು ಉಚಿತ (ಸಹಾಯಧನ: ₹${subsidyInr.toLocaleString('en-IN')}). ಹೆಚ್ಚುವರಿ ${excessUnits} ಯೂನಿಟ್‌ಗಳು ಮತ್ತು ಸ್ಥಿರ ಶುಲ್ಕಕ್ಕೆ ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ: ₹${netPayableInr.toLocaleString('en-IN')}.`;
      messageEn = `Partial Gruha Jyothi subsidy applied. ${entitledUnits} units subsidized (₹${subsidyInr.toLocaleString('en-IN')}). Net payable for ${excessUnits} excess units and fixed charges: ₹${netPayableInr.toLocaleString('en-IN')}.`;
    }

    return {
      consumerId: input.consumerId,
      escom: input.escom,
      connectionType: input.connectionType,
      sanctionedLoadKw: input.sanctionedLoadKw,
      averageAnnualConsumptionUnits: input.averageAnnualConsumptionUnits,
      currentMonthUnits: input.currentMonthUnits,
      entitledUnits,
      isZeroBill,
      isDisqualified,
      grossBillInr,
      subsidyInr,
      netPayableInr,
      excessUnits,
      tariffPerUnitInr: this.tariffPerUnit,
      fppcaPerUnitInr: this.fppcaRatePerUnit,
      fixedChargeInr,
      electricityTaxInr,
      messageKn,
      messageEn,
    };
  }
}

export const gruhaJyothiService = new GruhaJyothiService();
