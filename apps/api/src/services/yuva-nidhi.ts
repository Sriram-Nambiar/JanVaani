import { YuvaNidhiCheckInput } from '../schemas/yuva-nidhi.js';
import { sarvamService } from './sarvam.js';
import { maskApplicantName } from './tracker.js';

export interface YuvaNidhiResult {
  educationRegNo: string;
  applicantNameMasked: string;
  qualification: 'GRADUATE' | 'DIPLOMA' | 'POST_GRADUATE';
  passingYear: number;
  isEligible: boolean;
  benefitAmountPerMonth: number;
  maxBenefitDurationMonths: number;
  disqualificationReasonsKn: string[];
  disqualificationReasonsEn: string[];
  spokenExplanationKn: string;
  spokenExplanationEn: string;
  audioBase64?: string;
}

export class YuvaNidhiService {
  private demoRecords = new Map<string, YuvaNidhiCheckInput>([
    [
      'ENG-2024-8491',
      {
        educationRegNo: 'ENG-2024-8491',
        applicantName: 'ಚೇತನ್ ಕುಮಾರ್ (Chetan Kumar)',
        qualification: 'GRADUATE',
        passingYear: 2024,
        monthsUnemployed: 8,
        isEmployed: false,
        isPursuingHigherStudies: false,
        isKarnatakaDomicile: true,
        rationCardNumber: 'KA-04-9841284',
      },
    ],
    [
      'DIP-2025-1042',
      {
        educationRegNo: 'DIP-2025-1042',
        applicantName: 'ರಮ್ಯಾ ಎಸ್ (Ramya S)',
        qualification: 'DIPLOMA',
        passingYear: 2025,
        monthsUnemployed: 7,
        isEmployed: false,
        isPursuingHigherStudies: false,
        isKarnatakaDomicile: true,
        rationCardNumber: 'KA-12-3841029',
      },
    ],
  ]);

  public checkEligibility(input: YuvaNidhiCheckInput): Omit<YuvaNidhiResult, 'audioBase64'> {
    const reasonsKn: string[] = [];
    const reasonsEn: string[] = [];

    if (!input.isKarnatakaDomicile) {
      reasonsKn.push('ಅರ್ಜಿದಾರರು ಕನಿಷ್ಠ 6 ವರ್ಷಗಳ ಕರ್ನಾಟಕ ನಿವಾಸಿಯಾಗಿರಬೇಕು.');
      reasonsEn.push('Applicant must be a Karnataka domicile resident.');
    }

    if (input.isEmployed) {
      reasonsKn.push('ಅರ್ಜಿದಾರರು ಪ್ರಸ್ತುತ ಉದ್ಯೋಗದಲ್ಲಿರಬಾರದು (ಸರ್ಕಾರಿ ಅಥವಾ ಖಾಸಗಿ).');
      reasonsEn.push('Applicant must be currently unemployed.');
    }

    if (input.isPursuingHigherStudies) {
      reasonsKn.push('ಉನ್ನತ ವ್ಯಾಸಂಗ ಮುಂದುವರಿಸುತ್ತಿರುವವರು ಈ ಯೋಜನೆಗೆ ಅರ್ಹರಲ್ಲ.');
      reasonsEn.push('Applicant pursuing higher education is not eligible.');
    }

    if (input.monthsUnemployed < 6) {
      reasonsKn.push('ಪದವಿ/ಡಿಪ್ಲೋಮಾ ತೇರ್ಗಡೆಯಾದ ನಂತರ ಕನಿಷ್ಠ 180 ದಿನಗಳು (6 ತಿಂಗಳು) ಕಳೆದಿರಬೇಕು.');
      reasonsEn.push('Minimum 180 days (6 months) unemployment period required post-graduation.');
    }

    const isEligible = reasonsKn.length === 0;
    const benefitAmountPerMonth = !isEligible ? 0 : input.qualification === 'DIPLOMA' ? 1500 : 3000;
    const maxBenefitDurationMonths = 24; // Up to 2 years

    const qualNameKn =
      input.qualification === 'DIPLOMA' ? 'ಡಿಪ್ಲೋಮಾ' : input.qualification === 'POST_GRADUATE' ? 'ಸ್ನಾತಕೋತ್ತರ' : 'ಪದವೀಧರ';

    const spokenExplanationKn = isEligible
      ? `ಅಭಿನಂದನೆಗಳು! ${input.applicantName} ಅವರ ನೋಂದಣಿ ಸಂಖ್ಯೆ ${input.educationRegNo} ಯುವನಿಧಿ ಯೋಜನೆಗೆ ಅರ್ಹವಾಗಿದೆ. ನೀವು ${qualNameKn} ಕೋರ್ಸ್ ಮುಗಿಸಿದ್ದು, ಮಾಸಿಕ ₹${benefitAmountPerMonth} ನಿರುದ್ಯೋಗ ಭತ್ಯೆಯನ್ನು ಗರಿಷ್ಠ 2 ವರ್ಷಗಳವರೆಗೆ ನೇರವಾಗಿ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ (DBT) ಪಡೆಯಬಹುದು.`
      : `ಕ್ಷಮಿಸಿ, ${input.applicantName} ಅವರ ಅರ್ಜಿ ಯುವನಿಧಿ ನಿಯಮಾವಳಿಗಳ ಪ್ರಕಾರ ಅರ್ಹವಾಗಿಲ್ಲ: ${reasonsKn.join(' ')}`;

    const spokenExplanationEn = isEligible
      ? `Congratulations! ${input.applicantName} (Reg: ${input.educationRegNo}) is eligible for Yuva Nidhi. Monthly benefit of ₹${benefitAmountPerMonth} via DBT.`
      : `Application does not meet Yuva Nidhi criteria: ${reasonsEn.join(' ')}`;

    return {
      educationRegNo: input.educationRegNo.toUpperCase(),
      applicantNameMasked: maskApplicantName(input.applicantName),
      qualification: input.qualification,
      passingYear: input.passingYear,
      isEligible,
      benefitAmountPerMonth,
      maxBenefitDurationMonths,
      disqualificationReasonsKn: reasonsKn,
      disqualificationReasonsEn: reasonsEn,
      spokenExplanationKn,
      spokenExplanationEn,
    };
  }

  public async checkWithAudio(input: YuvaNidhiCheckInput): Promise<YuvaNidhiResult> {
    const result = this.checkEligibility(input);
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

  public lookupDemo(regNo: string): YuvaNidhiCheckInput | null {
    const key = regNo.trim().toUpperCase();
    return this.demoRecords.get(key) || null;
  }
}

export const yuvaNidhiService = new YuvaNidhiService();
