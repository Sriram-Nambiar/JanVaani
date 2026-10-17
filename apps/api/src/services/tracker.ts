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
  schemeId?: 'gruha_jyothi' | 'gruha_lakshmi' | 'caste_income';
  schemeNameKn: string;
  schemeNameEn: string;
  applicantName: string;
  aadhaarMasked?: string;
  currentStageKn: string;
  currentStageEn: string;
  timeline: ApplicationTimelineStep[];
  spokenNotificationKn: string;
  spokenNotificationEn: string;
  isReadyForDownload: boolean;
  auditFindings?: Array<{
    field: string;
    status: 'PASSED' | 'FLAGGED' | 'WARNING';
    noteKn: string;
    noteEn: string;
  }>;
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
      schemeId: 'caste_income',
      schemeNameKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ',
      schemeNameEn: 'Caste & Income Certificate',
      applicantName: 'ಸವಿತಾ (Savitha)',
      aadhaarMasked: maskId('582910492817'),
      currentStageKn: 'ತಹಸೀಲ್ದಾರ್ ಅನುಮೋದನೆ ಪೂರ್ಣಗೊಂಡಿದೆ (ಪ್ರಮಾಣ ಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ)',
      currentStageEn: 'Approved by Tahsildar (Ready for Download)',
      isReadyForDownload: true,
      auditFindings: [
        {
          field: 'Aadhaar Card',
          status: 'PASSED',
          noteKn: 'ಆಧಾರ್ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ',
          noteEn: 'Aadhaar identity verified',
        },
        {
          field: 'Income Certificate Affidavit',
          status: 'PASSED',
          noteKn: 'ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಅನುಮೋದನೆಗೊಂಡಿದೆ',
          noteEn: 'Income certificate affidavit approved',
        },
      ],
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
      schemeId: 'gruha_lakshmi',
      schemeNameKn: 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ',
      schemeNameEn: 'Gruha Lakshmi Scheme',
      applicantName: 'ಮಂಜುಳಾ (Manjula)',
      aadhaarMasked: maskId('982340192834'),
      currentStageKn: 'ಕಂದಾಯ ನಿರೀಕ್ಷಕರ ಪರಿಶೀಲನೆಯ ಹಂತದಲ್ಲಿದೆ',
      currentStageEn: 'Verification by Revenue Inspector In Progress',
      isReadyForDownload: false,
      auditFindings: [
        {
          field: 'Ration Card',
          status: 'PASSED',
          noteKn: 'ಕುಟುಂಬದ ಯಜಮಾನಿ ಮಹಿಳೆ ಎಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ',
          noteEn: 'Head of household confirmed',
        },
        {
          field: 'Bank Account Aadhaar Seeding',
          status: 'PASSED',
          noteKn: 'ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಆಧಾರ್ ಲಿಂಕ್ ಆಗಿದೆ',
          noteEn: 'Bank account NPCI mapping active',
        },
      ],
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
      schemeId: 'caste_income',
      schemeNameKn: 'ಪಡಿತರ ಚೀಟಿ ತಿದ್ದುಪಡಿ',
      schemeNameEn: 'Ration Card Correction',
      applicantName: 'ಬಸವರಾಜ್ (Basavaraj)',
      aadhaarMasked: maskId('710294827103'),
      currentStageKn: 'ದಾಖಲೆ ಮರು-ಸಲ್ಲಿಕೆ ಅಗತ್ಯವಿದೆ (Action Required)',
      currentStageEn: 'Action Required: Incomplete Family Tree Document',
      isReadyForDownload: false,
      auditFindings: [
        {
          field: 'Family Tree Certificate (ವಂಶವೃಕ್ಷ)',
          status: 'FLAGGED',
          noteKn: 'ವಂಶವೃಕ್ಷ ಪ್ರಮಾಣ ಪತ್ರ ಅಪೂರ್ಣವಾಗಿದೆ',
          noteEn: 'Incomplete family tree affidavit requiring re-submission',
        },
      ],
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
   * Find storage key case-insensitively to prevent duplicate entries
   */
  private findStorageKey(ackNumber: string): string | undefined {
    const target = ackNumber.trim().toUpperCase();
    for (const key of this.records.keys()) {
      if (key.trim().toUpperCase() === target) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Look up application status by acknowledgment / RD number
   */
  lookupStatus(rawAckNumber: string): ApplicationStatusRecord {
    const existingKey = this.findStorageKey(rawAckNumber);
    if (existingKey) {
      return this.records.get(existingKey)!;
    }

    const cleaned = rawAckNumber.trim().toUpperCase();
    // Default dynamic record for unseeded numbers
    return {
      ackNumber: cleaned,
      schemeNameKn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವಾ ಅರ್ಜಿ',
      schemeNameEn: 'Karnataka Public Service Application',
      applicantName: 'ನಾಗರಿಕರು (Citizen)',
      aadhaarMasked: maskId(cleaned),
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
    return this.findStorageKey(rawAckNumber) !== undefined;
  }

  /**
   * Register a newly submitted application record with collision guard
   */
  registerRecord(record: ApplicationStatusRecord): void {
    const existingKey = this.findStorageKey(record.ackNumber);
    if (existingKey) {
      throw new Error(`Record with acknowledgment number ${record.ackNumber} already exists.`);
    }
    this.records.set(record.ackNumber.trim().toUpperCase(), record);
  }

  /**
   * Atomically generate and register a unique record in a single critical section
   * Returns the registered record, or null if unique acknowledgment could not be allocated
   */
  registerUniqueRecord(
    createRecord: (ackNumber: string) => ApplicationStatusRecord,
    generateAckNumber: () => string,
    maxAttempts = 10
  ): ApplicationStatusRecord | null {
    for (let i = 0; i < maxAttempts; i++) {
      const ack = generateAckNumber().trim().toUpperCase();
      if (!this.findStorageKey(ack)) {
        const record = createRecord(ack);
        this.records.set(ack, record);
        return record;
      }
    }
    return null;
  }

  /**
   * Update the stage of an application record (used by Officer Simulation Push)
   */
  updateStage(
    ackNumber: string,
    stage: 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'FIELD_VERIFICATION' | 'RESUBMIT_REQUIRED',
    customMessageKn?: string
  ): ApplicationStatusRecord {
    const record = this.lookupStatus(ackNumber);

    let currentStageKn = record.currentStageKn;
    let currentStageEn = record.currentStageEn;
    let isReadyForDownload = record.isReadyForDownload;
    let spokenKn = '';
    let spokenEn = '';

    switch (stage) {
      case 'APPROVED': {
        currentStageKn = 'ತಹಸೀಲ್ದಾರ್ / ಇಲಾಖಾ ಅನುಮೋದನೆ ಪೂರ್ಣಗೊಂಡಿದೆ (ಪ್ರಮಾಣ ಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ)';
        currentStageEn = 'Approved by Officer (Ready for Download)';
        isReadyForDownload = true;
        spokenKn =
          customMessageKn ||
          `ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಅರ್ಜಿ ${record.ackNumber} ಅನುಮೋದನೆಗೊಂಡಿದೆ. ನಿಮ್ಮ ಪ್ರಮಾಣ ಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ.`;
        spokenEn = `Great news! Your application ${record.ackNumber} has been approved. Your certificate is ready for download.`;
        break;
      }
      case 'DISPATCHED': {
        currentStageKn = 'ಪ್ರಮಾಣ ಪತ್ರ ರವಾನಿಸಲಾಗಿದೆ / ಡೌನ್‌ಲೋಡ್‌ಗೆ ಲಭ್ಯವಿದೆ';
        currentStageEn = 'Dispatched and Available for Download';
        isReadyForDownload = true;
        spokenKn =
          customMessageKn ||
          `ನಿಮ್ಮ ಅರ್ಜಿ ${record.ackNumber} ಯಶಸ್ವಿಯಾಗಿ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿಕೊಳ್ಳಬಹುದು.`;
        spokenEn = `Your application ${record.ackNumber} is complete and dispatched.`;
        break;
      }
      case 'RESUBMIT_REQUIRED': {
        currentStageKn = 'ದಾಖಲೆ ಮರು-ಸಲ್ಲಿಕೆ ಅಗತ್ಯವಿದೆ (Action Required)';
        currentStageEn = 'Action Required: Additional Verification Needed';
        isReadyForDownload = false;
        spokenKn =
          customMessageKn ||
          `ಗಮನಿಸಿ: ನಿಮ್ಮ ಅರ್ಜಿ ${record.ackNumber} ಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಹೆಚ್ಚುವರಿ ದಾಖಲೆ ಸಲ್ಲಿಸಬೇಕಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.`;
        spokenEn = `Attention: Application ${record.ackNumber} requires additional document verification.`;
        break;
      }
      case 'FIELD_VERIFICATION': {
        currentStageKn = 'ಸ್ಥಳ ಪರಿಶೀಲನೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ (Field Verification in Progress)';
        currentStageEn = 'Field Verification in Progress';
        isReadyForDownload = false;
        spokenKn =
          customMessageKn ||
          `ನಿಮ್ಮ ಅರ್ಜಿ ${record.ackNumber} ಗೆ ಕಂದಾಯ ನಿರೀಕ್ಷಕರಿಂದ ಸ್ಥಳ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ.`;
        spokenEn = `Field verification is underway for application ${record.ackNumber}.`;
        break;
      }
      case 'REJECTED': {
        currentStageKn = 'ಅರ್ಜಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ (Rejected)';
        currentStageEn = 'Application Rejected';
        isReadyForDownload = false;
        spokenKn =
          customMessageKn ||
          `ಗಮನಿಸಿ: ನಿಮ್ಮ ಅರ್ಜಿ ${record.ackNumber} ತಿರಸ್ಕರಿಸಲಾಗಿದೆ. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗೆ ತಾಲೂಕು ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.`;
        spokenEn = `Application ${record.ackNumber} has been rejected.`;
        break;
      }
    }

    const updatedTimeline = record.timeline.map((step) => {
      if (stage === 'APPROVED' && step.step <= 3) {
        return {
          ...step,
          status: 'COMPLETED' as const,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      if (stage === 'DISPATCHED' && step.step === 4) {
        return {
          ...step,
          status: 'COMPLETED' as const,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return step;
    });

    const updatedRecord: ApplicationStatusRecord = {
      ...record,
      currentStageKn,
      currentStageEn,
      isReadyForDownload,
      timeline: updatedTimeline,
      spokenNotificationKn: spokenKn,
      spokenNotificationEn: spokenEn,
    };

    const targetKey = ackNumber.trim().toUpperCase();
    const existingKey = this.findStorageKey(ackNumber);
    if (existingKey) {
      this.records.delete(existingKey);
    }
    this.records.set(targetKey, updatedRecord);
    return updatedRecord;
  }
}

/**
 * Mask applicant name to preserve privacy in shared/public lookup interfaces.
 * Uses Intl.Segmenter to respect Indic script (Kannada) grapheme clusters
 * avoiding splitting combining vowel marks, viramas, or conjunct consonants.
 */
export function maskApplicantName(name: string): string {
  if (!name) return 'ನಾಗರಿಕರು (Citizen)';
  const segmenter = new Intl.Segmenter('kn-IN', { granularity: 'grapheme' });
  const parts = name.trim().split(/\s+/);
  return parts
    .map((word) => {
      const graphemes = Array.from(segmenter.segment(word)).map((s) => s.segment);
      if (graphemes.length <= 2) {
        return word;
      }
      const first = graphemes[0];
      const last = graphemes[graphemes.length - 1];
      const maskCount = Math.max(1, graphemes.length - 2);
      return `${first}${'*'.repeat(maskCount)}${last}`;
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
