import crypto from 'node:crypto';
import { ShaktiPassApplyInput, ShaktiRouteCheckInput } from '../schemas/shakti.js';
import { sarvamService } from './sarvam.js';
import { maskApplicantName, maskId } from './tracker.js';

export interface ShaktiPassResult {
  passNumber: string;
  applicantNameMasked: string;
  gender: 'FEMALE';
  isKarnatakaDomicile: boolean;
  aadhaarMasked: string;
  preferredRtc: string;
  district: string;
  issuedAt: string;
  validThrough: string;
  spokenConfirmationKn: string;
  spokenConfirmationEn: string;
  audioBase64?: string;
}

export interface ShaktiRouteResult {
  rtc: string;
  busCategory: string;
  origin: string;
  destination: string;
  isZeroTicketEligible: boolean;
  standardFare: number;
  payableFare: number;
  subsidySavings: number;
  spokenExplanationKn: string;
  spokenExplanationEn: string;
  audioBase64?: string;
}

export class ShaktiService {
  private demoPasses = new Map<string, ShaktiPassResult>([
    [
      'SHAKTI-KAR-2026-B812',
      {
        passNumber: 'SHAKTI-KAR-2026-B812',
        applicantNameMasked: 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)',
        gender: 'FEMALE',
        isKarnatakaDomicile: true,
        aadhaarMasked: 'XXXX-XXXX-4821',
        preferredRtc: 'BMTC',
        district: 'Bengaluru Urban',
        issuedAt: '2026-06-11T10:00:00.000Z',
        validThrough: '2028-06-11T10:00:00.000Z',
        spokenConfirmationKn:
          'ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಶಕ್ತಿ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್ ನೋಂದಣಿ ಸಂಖ್ಯೆ SHAKTI-KAR-2026-B812 ಯಶಸ್ವಿಯಾಗಿದೆ. ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಬಸ್‌ಗಳಲ್ಲಿ ಉಚಿತವಾಗಿ ಪ್ರಯಾಣಿಸಬಹುದು.',
        spokenConfirmationEn:
          'Congratulations! Your Shakti Smart Pass SHAKTI-KAR-2026-B812 is active for 100% free travel across Karnataka state buses.',
      },
    ],
  ]);

  public async issuePass(input: ShaktiPassApplyInput): Promise<ShaktiPassResult> {
    if (!input.isKarnatakaDomicile) {
      throw new Error('Shakti Scheme requires Karnataka domicile proof');
    }

    const entropy = crypto.randomBytes(2).toString('hex').toUpperCase();
    const passNumber = `SHAKTI-KAR-2026-${entropy}`;
    const issuedAt = new Date().toISOString();
    const validThroughDate = new Date();
    validThroughDate.setFullYear(validThroughDate.getFullYear() + 2);
    const validThrough = validThroughDate.toISOString();

    const spokenConfirmationKn = `ಶುಭ ಸುದ್ದಿ! ${input.applicantName} ಅವರಿಗೆ ಶಕ್ತಿ ಯೋಜನೆಯಡಿ ಉಚಿತ ಬಸ್ ಪ್ರಯಾಣ ಪಾಸ್ ಸಿದ್ಧವಾಗಿದೆ. ಪಾಸ್ ಸಂಖ್ಯೆ ${passNumber}. ಕರ್ನಾಟಕದ KSRTC, BMTC, NWKRTC ಹಾಗೂ KKRTC ಸಾಮಾನ್ಯ ಮತ್ತು ವೇಗದೂತ ಬಸ್‌ಗಳಲ್ಲಿ ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿ ಪ್ರಯಾಣಿಸಬಹುದು.`;
    const spokenConfirmationEn = `Success! Shakti Scheme Free Bus Travel Pass issued for ${input.applicantName}. Pass Number: ${passNumber}. 100% free travel across RTC state buses.`;

    let audioBase64: string | undefined;
    try {
      const tts = await sarvamService.textToSpeech(spokenConfirmationKn, 'kn-IN');
      audioBase64 = tts.audioBase64;
    } catch {
      audioBase64 = undefined;
    }

    const passResult: ShaktiPassResult = {
      passNumber,
      applicantNameMasked: maskApplicantName(input.applicantName),
      gender: 'FEMALE',
      isKarnatakaDomicile: true,
      aadhaarMasked: maskId(input.aadhaarNumber),
      preferredRtc: input.preferredRtc,
      district: input.district,
      issuedAt,
      validThrough,
      spokenConfirmationKn,
      spokenConfirmationEn,
      audioBase64,
    };

    this.demoPasses.set(passNumber, passResult);
    return passResult;
  }

  public async checkRoute(input: ShaktiRouteCheckInput): Promise<ShaktiRouteResult> {
    const isFree = ['ORDINARY', 'EXPRESS', 'NAGARA_SARIGE'].includes(input.busCategory);
    const standardFare = input.busCategory === 'EXPRESS' ? 120 : input.busCategory === 'ORDINARY' ? 45 : 350;
    const payableFare = isFree ? 0 : standardFare;
    const subsidySavings = isFree ? standardFare : 0;

    const busNameKn =
      input.busCategory === 'ORDINARY'
        ? 'ಸಾಮಾನ್ಯ ಬಸ್ (Ordinary)'
        : input.busCategory === 'EXPRESS'
        ? 'ಕರ್ನಾಟಕ ಸಾರಿಗೆ ವೇಗದೂತ (Express)'
        : input.busCategory === 'NAGARA_SARIGE'
        ? 'ನಗರ ಸಾರಿಗೆ (City Bus)'
        : 'ರಾಜಹಂಸ / ಐರಾವತ ಐಷಾರಾಮಿ (Luxury)';

    const spokenExplanationKn = isFree
      ? `ಶಕ್ತಿ ಯೋಜನೆಯಡಿ ${input.origin} ನಿಂದ ${input.destination} ನಡುವಿನ ${input.rtc} ${busNameKn} ಪ್ರಯಾಣ ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿದೆ. ಶೂನ್ಯ ಶುಲ್ಕ ಟಿಕೆಟ್ (₹0 Zero Ticket). ನಿಮಗೆ ₹${subsidySavings} ಉಳಿತಾಯವಾಗಿದೆ.`
      : `ಗಮನಿಸಿ: ${input.rtc} ${busNameKn} ಐಷಾರಾಮಿ ಸೇವೆಯಾಗಿದ್ದು ಶಕ್ತಿ ಯೋಜನೆಯಡಿ ಒಳಪಡುವುದಿಲ್ಲ. ಪ್ರಯಾಣ ದರ ₹${payableFare} ಪಾವತಿಸಬೇಕಾಗುತ್ತದೆ.`;

    const spokenExplanationEn = isFree
      ? `Under Shakti Scheme, ${input.rtc} ${input.busCategory} travel from ${input.origin} to ${input.destination} is 100% free (₹0 Zero Ticket). You saved ₹${subsidySavings}.`
      : `Notice: ${input.rtc} ${input.busCategory} is a luxury category not covered under Shakti Scheme. Fare payable is ₹${payableFare}.`;

    let audioBase64: string | undefined;
    try {
      const tts = await sarvamService.textToSpeech(spokenExplanationKn, 'kn-IN');
      audioBase64 = tts.audioBase64;
    } catch {
      audioBase64 = undefined;
    }

    return {
      rtc: input.rtc,
      busCategory: input.busCategory,
      origin: input.origin,
      destination: input.destination,
      isZeroTicketEligible: isFree,
      standardFare,
      payableFare,
      subsidySavings,
      spokenExplanationKn,
      spokenExplanationEn,
      audioBase64,
    };
  }

  public lookupPass(passNumber: string): ShaktiPassResult | null {
    const key = passNumber.trim().toUpperCase();
    return this.demoPasses.get(key) || null;
  }
}

export const shaktiService = new ShaktiService();
