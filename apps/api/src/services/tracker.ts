/**
 * Application Status Tracker Service (Audio Status Bell)
 * Tracks Karnataka public service acknowledgment numbers (e.g., RD numbers from Seva Sindhu / Nadakacheri)
 */

export interface ApplicationTimelineStep {
  step: number;
  labelKn: string;
  labelEn: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'REJECTED';
  updatedAt?: string;
  office?: string;
}

export interface ApplicationStatusRecord {
  ackNumber: string;
  schemeNameKn: string;
  schemeNameEn: string;
  applicantName: string;
  currentStageKn: string;
  currentStageEn: string;
  timeline: ApplicationTimelineStep[];
  spokenNotificationKn: string;
  spokenNotificationEn: string;
  isReadyForDownload: boolean;
}

export class ApplicationTrackerService {
  private records: Map<string, ApplicationStatusRecord> = new Map();

  constructor() {
    this.seedInitialRecords();
  }

  private seedInitialRecords() {
    // Seed 1: Approved and Ready (RD001)
    this.records.set('RD001', {
      ackNumber: 'RD001',
      schemeNameKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ',
      schemeNameEn: 'Caste & Income Certificate',
      applicantName: 'ಸವಿತಾ (Savitha)',
      currentStageKn: 'ತಹಸೀಲ್ದಾರ್ ಅನುಮೋದನೆ ಪೂರ್ಣಗೊಂಡಿದೆ (ಪ್ರಮಾಣ ಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ)',
      currentStageEn: 'Approved by Tahsildar (Ready for Download)',
      isReadyForDownload: true,
      timeline: [
        { step: 1, labelKn: 'ಗ್ರಾಮ ಒನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ', labelEn: 'Application Submitted at Grama One', status: 'COMPLETED', updatedAt: '2026-10-10' },
        { step: 2, labelKn: 'ಕಂದಾಯ ನಿರೀಕ್ಷಕರ (RI) ಸ್ಥಳ ಪರಿಶೀಲನೆ', labelEn: 'Revenue Inspector Verification', status: 'COMPLETED', updatedAt: '2026-10-12' },
        { step: 3, labelKn: 'ತಹಸೀಲ್ದಾರ್ ಡಿಜಿಟಲ್ ಸಹಿ ಮತ್ತು ಅನುಮೋದನೆ', labelEn: 'Tahsildar Digital Signature & Approval', status: 'COMPLETED', updatedAt: '2026-10-14' },
        { step: 4, labelKn: 'ಪ್ರಮಾಣ ಪತ್ರ ಡೌನ್‌ಲೋಡ್‌ಗೆ ಲಭ್ಯವಿದೆ', labelEn: 'Certificate Dispatched / Ready for Download', status: 'COMPLETED', updatedAt: '2026-10-15' },
      ],
      spokenNotificationKn:
        'ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD001 ತಹಸೀಲ್ದಾರ್ ಅವರಿಂದ ಅನುಮೋದನೆಗೊಂಡಿದೆ. ನಿಮ್ಮ ಪ್ರಮಾಣ ಪತ್ರ ಸಿದ್ಧವಾಗಿದ್ದು, ನಿಮ್ಮ ವಾಟ್ಸಾಪ್‌ಗೆ ಡೌನ್‌ಲೋಡ್ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ.',
      spokenNotificationEn:
        'Great news! Your application RD001 has been approved by the Tahsildar. Your certificate is ready for download.',
    });

    // Seed 2: In-Progress at Revenue Inspector (RD002)
    this.records.set('RD002', {
      ackNumber: 'RD002',
      schemeNameKn: 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ',
      schemeNameEn: 'Gruha Lakshmi Scheme',
      applicantName: 'ಮಂಜುಳಾ (Manjula)',
      currentStageKn: 'ಕಂದಾಯ ನಿರೀಕ್ಷಕರ ಪರಿಶೀಲನೆಯ ಹಂತದಲ್ಲಿದೆ',
      currentStageEn: 'Verification by Revenue Inspector In Progress',
      isReadyForDownload: false,
      timeline: [
        { step: 1, labelKn: 'ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ', labelEn: 'Application Submitted', status: 'COMPLETED', updatedAt: '2026-10-13' },
        { step: 2, labelKn: 'ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿ ಮತ್ತು RI ಪರಿಶೀಲನೆ', labelEn: 'Field Verification in Progress', status: 'IN_PROGRESS', updatedAt: '2026-10-15' },
        { step: 3, labelKn: 'ತಾಲೂಕು ಅಧಿಕಾರಿ ಅನುಮೋದನೆ', labelEn: 'Taluk Approval', status: 'PENDING' },
        { step: 4, labelKn: 'ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆ', labelEn: 'Disbursement to Bank Account', status: 'PENDING' },
      ],
      spokenNotificationKn:
        'ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD002 ಪ್ರಸ್ತುತ ಕಂದಾಯ ನಿರೀಕ್ಷಕರ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ. ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ ತಹಸೀಲ್ದಾರ್ ಅನುಮೋದನೆ ಸಿಗಲಿದೆ, ಕಚೇರಿಗೆ ಹೋಗುವ ಅಗತ್ಯವಿಲ್ಲ.',
      spokenNotificationEn:
        'Your application RD002 is under field verification by the Revenue Inspector. Tahsildar approval is expected in 3 days. No office visit required.',
    });

    // Seed 3: Action Required / Document Issue (RD003)
    this.records.set('RD003', {
      ackNumber: 'RD003',
      schemeNameKn: 'ಪಡಿತರ ಚೀಟಿ ತಿದ್ದುಪಡಿ',
      schemeNameEn: 'Ration Card Correction',
      applicantName: 'ಬಸವರಾಜ್ (Basavaraj)',
      currentStageKn: 'ದಾಖಲೆ ಮರು-ಸಲ್ಲಿಕೆ ಅಗತ್ಯವಿದೆ (Action Required)',
      currentStageEn: 'Action Required: Incomplete Family Tree Document',
      isReadyForDownload: false,
      timeline: [
        { step: 1, labelKn: 'ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ', labelEn: 'Application Submitted', status: 'COMPLETED', updatedAt: '2026-10-11' },
        { step: 2, labelKn: 'ದಾಖಲೆ ಪರಿಶೀಲನೆಯಲ್ಲಿ ದೋಷ', labelEn: 'Document Discrepancy Flagged', status: 'REJECTED', updatedAt: '2026-10-14' },
        { step: 3, labelKn: 'ಮರು ಪರಿಶೀಲನೆ', labelEn: 'Re-verification', status: 'PENDING' },
        { step: 4, labelKn: 'ಅಂತಿಮ ಆದೇಶ', labelEn: 'Final Approval', status: 'PENDING' },
      ],
      spokenNotificationKn:
        'ಗಮನಿಸಿ: ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD003 ರಲ್ಲಿ ವಂಶವೃಕ್ಷ (Family Tree) ಪ್ರಮಾಣ ಪತ್ರ ಅಪೂರ್ಣವಾಗಿದೆ. ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರದಲ್ಲಿ ಹೊಸ ಪ್ರಮಾಣ ಪತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
      spokenNotificationEn:
        'Attention: Application RD003 requires an updated Family Tree affidavit. Please upload it at your nearest Grama One center.',
    });
  }

  /**
   * Look up application status by acknowledgment / RD number
   */
  lookupStatus(rawAckNumber: string): ApplicationStatusRecord {
    const cleaned = rawAckNumber.trim().toUpperCase();
    
    // Exact match or fallback lookup
    if (this.records.has(cleaned)) {
      return this.records.get(cleaned)!;
    }

    // Default dynamic record for unseeded numbers
    return {
      ackNumber: cleaned,
      schemeNameKn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವಾ ಅರ್ಜಿ',
      schemeNameEn: 'Karnataka Public Service Application',
      applicantName: 'ನಾಗರಿಕರು (Citizen)',
      currentStageKn: 'ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ - ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
      currentStageEn: 'Application Received & Under Verification',
      isReadyForDownload: false,
      timeline: [
        { step: 1, labelKn: 'ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ', labelEn: 'Application Received', status: 'COMPLETED', updatedAt: '2026-10-16' },
        { step: 2, labelKn: 'ಅಧಿಕಾರಿಗಳ ಪರಿಶೀಲನೆ', labelEn: 'Verification by Officials', status: 'IN_PROGRESS' },
        { step: 3, labelKn: 'ಅನುಮೋದನೆ', labelEn: 'Approval', status: 'PENDING' },
        { step: 4, labelKn: 'ಪ್ರಮಾಣ ಪತ್ರ ವಿತರಣೆ', labelEn: 'Dispatch', status: 'PENDING' },
      ],
      spokenNotificationKn: `ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${cleaned} ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಣಿಯಾಗಿದೆ ಮತ್ತು ಅಧಿಕಾರಿಗಳಿಂದ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ. ಯಾವುದೇ ಬದಲಾವಣೆ ಇದ್ದರೆ ನಾವು ತಕ್ಷಣ ಧ್ವನಿ ಸಂದೇಶ ಕಳುಹಿಸುತ್ತೇವೆ.`,
      spokenNotificationEn: `Your application ${cleaned} has been registered and is under official verification. We will notify you as soon as the status updates.`,
    };
  }

  /**
   * Check if a record exists for the given acknowledgment number
   */
  hasRecord(rawAckNumber: string): boolean {
    return this.records.has(rawAckNumber.trim().toUpperCase());
  }

  /**
   * Register a newly submitted application record with collision guard
   */
  registerRecord(record: ApplicationStatusRecord): void {
    const key = record.ackNumber.trim().toUpperCase();
    if (this.records.has(key)) {
      throw new Error(`Record with acknowledgment number ${key} already exists.`);
    }
    this.records.set(key, record);
  }
}

/**
 * Mask applicant name to preserve privacy in shared/public lookup interfaces
 */
export function maskApplicantName(name: string): string {
  if (!name) return 'ನಾಗರಿಕರು (Citizen)';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p;
      return p[0] + '*'.repeat(p.length - 2) + p[p.length - 1];
    })
    .join(' ');
}

/**
 * Mask identifier (e.g. consumer ID or Aadhaar) to keep last 4 digits only
 */
export function maskId(id: string): string {
  if (!id || id.length < 4) return '****';
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

export const trackerService = new ApplicationTrackerService();
