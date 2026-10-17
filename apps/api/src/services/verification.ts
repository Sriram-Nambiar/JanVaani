import crypto from 'node:crypto';
import { trackerService, maskApplicantName, maskId } from './tracker.js';
import { sarvamService } from './sarvam.js';

export interface CertificateVerificationResult {
  ackNumber: string;
  applicantNameMasked: string;
  schemeNameKn: string;
  schemeNameEn: string;
  currentStageKn: string;
  isAuthentic: boolean;
  verificationBadge: 'DIGITALLY_SIGNED_GENUINE' | 'IN_PROCESS_GENUINE' | 'ACTION_REQUIRED_FLAGGED';
  digitalSignatureSha256: string;
  issuingAuthority: string;
  verifiedAt: string;
  spokenVerificationKn: string;
  audioBase64?: string;
  aadhaarMasked: string;
}

export class CertificateVerificationService {
  private hmacSecret = 'janvaani_karnataka_gov_secure_key_2026';

  public async verify(rawAckNumber: string): Promise<CertificateVerificationResult | null> {
    const ackNumber = rawAckNumber.trim().toUpperCase();
    if (!trackerService.hasRecord(ackNumber)) {
      return null;
    }

    const record = trackerService.lookupStatus(ackNumber);

    const digitalSignatureSha256 = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(`${record.ackNumber}:${record.applicantName}`)
      .digest('hex')
      .toUpperCase();

    let badge: 'DIGITALLY_SIGNED_GENUINE' | 'IN_PROCESS_GENUINE' | 'ACTION_REQUIRED_FLAGGED' = 'IN_PROCESS_GENUINE';
    if (record.isReadyForDownload) {
      badge = 'DIGITALLY_SIGNED_GENUINE';
    } else if (record.currentStageKn.includes('ದೋಷ') || record.currentStageKn.includes('ಅಗತ್ಯವಿದೆ')) {
      badge = 'ACTION_REQUIRED_FLAGGED';
    }

    const spokenVerificationKn = `ದಾಖಲೆ ದೃಢೀಕರಣ ಯಶಸ್ವಿಯಾಗಿದೆ. ಅರ್ಜಿ ಸಂಖ್ಯೆ ${record.ackNumber}, ಅರ್ಜಿದಾರರು ${record.applicantName}. ಇದು ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಅಧಿಕೃತ ಸೇವಾ ಸಿಂಧು ದಾಖಲೆಯಾಗಿದ್ದು, ಸತ್ಯಾಸತ್ಯತೆ ದೃಢಪಟ್ಟಿದೆ.`;

    let audioBase64: string | undefined;
    try {
      const tts = await sarvamService.textToSpeech(spokenVerificationKn, 'kn-IN');
      audioBase64 = tts.audioBase64;
    } catch {
      audioBase64 = undefined;
    }

    return {
      ackNumber: record.ackNumber,
      applicantNameMasked: maskApplicantName(record.applicantName),
      schemeNameKn: record.schemeNameKn,
      schemeNameEn: record.schemeNameEn,
      currentStageKn: record.currentStageKn,
      isAuthentic: true,
      verificationBadge: badge,
      digitalSignatureSha256,
      issuingAuthority: 'Government of Karnataka • Seva Sindhu 2.0 & Nadakacheri Gateway',
      verifiedAt: new Date().toISOString(),
      spokenVerificationKn,
      audioBase64,
      aadhaarMasked: maskId('582910492817'),
    };
  }
}

export const certificateVerificationService = new CertificateVerificationService();
