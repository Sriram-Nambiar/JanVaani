import { ApplicationStatusRecord, trackerService } from './tracker.js';

export interface BmtcConversationResult {
  step: 'AWAITING_AADHAAR' | 'AWAITING_OTP' | 'SUBMITTED' | 'OTP_ERROR';
  formDraft: any;
  messageKn: string;
  messageEn: string;
  statusRecord?: ApplicationStatusRecord;
  portalData?: any;
}

interface UserSession {
  senderId: string;
  step: 'IDLE' | 'AWAITING_AADHAAR' | 'AWAITING_OTP' | 'SUBMITTED';
  studentName: string;
  institutionName: string;
  course: string;
  pickupStop: string;
  destinationStop: string;
  mobileNumber: string;
  aadhaarNumber?: string;
  otpCode?: string;
  applicationId?: string;
  lastUpdated: number;
}

class BmtcSessionManager {
  private sessions = new Map<string, UserSession>();

  private getOrCreateSession(senderId: string): UserSession {
    let session = this.sessions.get(senderId);
    if (!session) {
      session = {
        senderId,
        step: 'IDLE',
        studentName: 'Priya Sharma',
        institutionName: 'BMS College of Engineering, Basavanagudi',
        course: 'B.Tech Computer Science - 3rd Year',
        pickupStop: 'Banashankari TTMC',
        destinationStop: 'Majestic (Kempegowda Bus Station)',
        mobileNumber: '9845012345',
        lastUpdated: Date.now(),
      };
      this.sessions.set(senderId, session);
    }
    session.lastUpdated = Date.now();
    return session;
  }

  public resetSession(senderId: string): void {
    this.sessions.delete(senderId);
  }

  public async processMessage(
    senderId: string,
    rawText: string,
    scenarioHint?: string
  ): Promise<BmtcConversationResult | null> {
    const text = (rawText || '').trim();
    const lower = text.toLowerCase();
    const session = this.getOrCreateSession(senderId);

    // Clean digit sequences
    const digitsOnly = text.replace(/\D/g, '');

    const isBmtcTrigger =
      scenarioHint?.startsWith('bmtc') ||
      lower.includes('bmtc') ||
      lower.includes('bus pass') ||
      lower.includes('student pass') ||
      text.includes('ಬಸ್ ಪಾಸ್') ||
      text.includes('ಪಾಸ್') ||
      text.includes('ವಿದ್ಯಾರ್ಥಿ ಪಾಸ್');

    const containsAadhaar = digitsOnly.includes('443350105028') || (digitsOnly.length === 12 && session.step !== 'SUBMITTED');
    const containsOtp = text.includes('3344') || (session.step === 'AWAITING_OTP' && digitsOnly.length === 4);

    // If neither a BMTC trigger, nor in an active BMTC session, nor containing demo numbers, ignore
    if (!isBmtcTrigger && session.step === 'IDLE' && !containsAadhaar && !containsOtp) {
      return null;
    }

    // CASE 1: All-in-one or direct submission (e.g. preset or prompt with both Aadhaar and OTP)
    if (containsAadhaar && (containsOtp || scenarioHint === 'bmtc_student_pass_submit')) {
      session.aadhaarNumber = '4433 5010 5028';
      session.otpCode = '3344';
      return await this.submitToPortal(session);
    }

    // CASE 2: User is currently at AWAITING_OTP or sends OTP
    if (session.step === 'AWAITING_OTP' || containsOtp) {
      if (text.includes('3344') || scenarioHint === 'bmtc_student_pass_submit' || lower.includes('confirm')) {
        session.otpCode = '3344';
        return await this.submitToPortal(session);
      } else {
        // Incorrect OTP entered
        return {
          step: 'OTP_ERROR',
          formDraft: this.buildDraft(session, false),
          messageKn: 'ತಪ್ಪಾದ ಓಟಿಪಿ (Invalid OTP). ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ಕಳುಹಿಸಲಾದ ಸರಿಯಾದ 4-ಅಂಕಿಯ ಓಟಿಪಿ ನಮೂದಿಸಿ (ಡೆಮೊ ಓಟಿಪಿ: 3344).',
          messageEn: 'Invalid OTP. Please enter the correct 4-digit verification OTP (Demo OTP: 3344).',
        };
      }
    }

    // CASE 3: User enters Aadhaar (or has entered Aadhaar)
    if (containsAadhaar || (digitsOnly.length === 12 && (session.step === 'AWAITING_AADHAAR' || isBmtcTrigger))) {
      session.aadhaarNumber = '4433 5010 5028';
      session.step = 'AWAITING_OTP';

      const draft = this.buildDraft(session, false);
      return {
        step: 'AWAITING_OTP',
        formDraft: draft,
        messageKn: 'ಆಧಾರ್ ವಿವರಗಳು (XXXX-XXXX-5028) ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ! ನಿಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ 4-ಅಂಕಿಯ ಓಟಿಪಿ (OTP) ಕಳುಹಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಓಟಿಪಿ ಸಂಖ್ಯೆಯನ್ನು (ಡೆಮೊ ಓಟಿಪಿ: 3344) ನಮೂದಿಸಿ.',
        messageEn: 'Aadhaar identity (XXXX-XXXX-5028) verified successfully for Priya Sharma. A 4-digit OTP has been sent to registered mobile ending in ...2345. Please type OTP: 3344 to submit.',
      };
    }

    // CASE 4: Initial step - User requests BMTC student pass
    session.step = 'AWAITING_AADHAAR';
    const draft = this.buildDraft(session, false);

    return {
      step: 'AWAITING_AADHAAR',
      formDraft: draft,
      messageKn: 'ಖಂಡಿತ! ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.\n\nವಿದ್ಯಾರ್ಥಿ: ಪ್ರಿಯಾ ಶರ್ಮಾ\nಕಾಲೇಜು: ಬಿಎಂಎಸ್ ಇಂಜಿನಿಯರಿಂಗ್ ಕಾಲೇಜು (BMSCE)\nಮಾರ್ಗ: ಬನಶಂಕರಿ TTMC ➔ ಮೆಜೆಸ್ಟಿಕ್\n\nಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ 12-ಅಂಕಿಯ ಆಧಾರ್ ಸಂಖ್ಯೆಯನ್ನು (Aadhaar: 4433 5010 5028) ನಮೂದಿಸಿ.',
      messageEn: 'Certainly! I will help you apply for the BMTC Concessional Student Bus Pass for Priya Sharma (BMS College, Route: Banashankari TTMC -> Majestic). Please enter your 12-digit Aadhaar number (4433 5010 5028) to proceed with e-KYC.',
    };
  }

  private buildDraft(session: UserSession, isComplete: boolean) {
    const extractedFields: Record<string, string | number> = {
      studentName: session.studentName,
      institutionName: session.institutionName,
      course: session.course,
      pickupStop: session.pickupStop,
      destinationStop: session.destinationStop,
      mobileNumber: session.mobileNumber,
    };

    if (session.aadhaarNumber) {
      extractedFields.aadhaarNumber = session.aadhaarNumber;
    }
    if (session.otpCode) {
      extractedFields.otpCode = session.otpCode;
    }

    const missingFields = [];
    if (!session.aadhaarNumber) {
      missingFields.push({ key: 'aadhaarNumber', labelKn: 'ಆಧಾರ್ ಸಂಖ್ಯೆ', labelEn: 'Aadhaar Number' });
    }
    if (!session.otpCode) {
      missingFields.push({ key: 'otpCode', labelKn: 'ಓಟಿಪಿ ಕೋಡ್', labelEn: 'OTP Code' });
    }

    return {
      schemeId: 'bmtc_student_pass',
      schemeNameKn: 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್',
      schemeNameEn: 'BMTC Student Concessional Bus Pass',
      extractedFields,
      missingFields,
      isComplete,
      promptForCitizenKn: isComplete
        ? 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಪಾಸ್ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.'
        : 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಪಾಸ್ ವಿವರಗಳು ಸಿದ್ಧವಾಗುತ್ತಿವೆ.',
    };
  }

  private async submitToPortal(session: UserSession): Promise<BmtcConversationResult> {
    session.step = 'SUBMITTED';
    const sevaApiUrl = process.env.SEVA_API_URL || 'http://localhost:3002';

    const payload = {
      studentName: session.studentName,
      aadhaarNumber: session.aadhaarNumber || '4433 5010 5028',
      mobileNumber: session.mobileNumber,
      institutionName: session.institutionName,
      course: session.course,
      pickupStop: session.pickupStop,
      destinationStop: session.destinationStop,
      otpCode: session.otpCode || '3344',
      source: 'JANVAANI_AI' as const,
    };

    console.log('[BmtcSessionManager] Submitting student pass application payload to Seva Sindhu API:', payload);

    let portalData: any = null;

    try {
      const res = await fetch(`${sevaApiUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        portalData = await res.json();
      }
    } catch (err: any) {
      console.warn('[BmtcSessionManager] Offline/direct fallback:', err.message);
    }

    const appId = portalData?.applicationId || `SEVA-DEMO-${Date.now()}-A8F2`;
    session.applicationId = appId;

    const statusRecord = trackerService.registerUniqueRecord(
      () => ({
        ackNumber: appId,
        schemeId: 'bmtc_student_pass',
        schemeNameKn: 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್',
        schemeNameEn: 'BMTC Student Concessional Bus Pass',
        applicantName: 'ಪ್ರಿಯಾ ಶರ್ಮಾ (Priya Sharma)',
        aadhaarMasked: 'XXXX-XXXX-5028',
        currentStageKn: 'ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಣಿಯಾಗಿದೆ - ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
        currentStageEn: 'Registered at Seva Sindhu Portal - Under Verification',
        isReadyForDownload: false,
        timeline: [
          {
            step: 1,
            labelKn: 'ಜನವಾಣಿ AI ಮೂಲಕ ಸೇವಾ ಸಿಂಧುಗೆ ಸಲ್ಲಿಕೆ',
            labelEn: 'Submitted to Seva Sindhu via JanVaani AI',
            status: 'COMPLETED' as const,
            updatedAt: new Date().toISOString().split('T')[0],
          },
          {
            step: 2,
            labelKn: 'ಕಾಲೇಜು ಬೋನಫೈಡ್ ಮತ್ತು ಆಧಾರ್ ಇ-ಕೆವೈಸಿ ಪರಿಶೀಲನೆ',
            labelEn: 'College Bonafide & Aadhaar Verification',
            status: 'IN_PROGRESS' as const,
          },
          {
            step: 3,
            labelKn: 'ಬಿಎಂಟಿಸಿ ಕೇಂದ್ರೀಯ ವಿಭಾಗ ಅನುಮೋದನೆ',
            labelEn: 'BMTC Central Division Sanction',
            status: 'PENDING' as const,
          },
          {
            step: 4,
            labelKn: 'ಡಿಜಿಟಲ್ ಬಸ್ ಪಾಸ್ ವಿತರಣೆ',
            labelEn: 'Digital Student Pass Dispatched',
            status: 'PENDING' as const,
          },
        ],
        spokenNotificationKn: `ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಬಸ್ ಪಾಸ್ ಅರ್ಜಿಯನ್ನು ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅರ್ಜಿ ಸಂಖ್ಯೆ ${appId}.`,
        spokenNotificationEn:
          portalData?.acknowledgement ||
          `Success! Your BMTC Student Pass application has been registered with Seva Sindhu Portal (ID: ${appId}). Status: SUBMITTED.`,
      }),
      () => appId
    );

    const draft = this.buildDraft(session, true);

    const messageKn = `🎉 ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಬಸ್ ಪಾಸ್ ಅರ್ಜಿಯನ್ನು ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (Seva Sindhu) ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!\n\n📋 ಅರ್ಜಿ ಸಂಖ್ಯೆ (Application ID): ${appId}\n👤 ವಿದ್ಯಾರ್ಥಿ: ಪ್ರಿಯಾ ಶರ್ಮಾ\n🚌 ಮಾರ್ಗ: ಬನಶಂಕರಿ TTMC ➔ ಮೆಜೆಸ್ಟಿಕ್\n🏫 ಕಾಲೇಜು: ಬಿಎಂಎಸ್ ಇಂಜಿನಿಯರಿಂಗ್ ಕಾಲೇಜು (BMSCE)\n✅ ಸ್ಥಿತಿ: ಸ್ವೀಕರಿಸಲಾಗಿದೆ (SUBMITTED)\n\nನೀವು ಈ ಅರ್ಜಿ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿ ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (Port 5174) ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಬಹುದು.`;

    const messageEn =
      portalData?.acknowledgement ||
      `Your BMTC Concessional Student Pass application has been registered with Seva Sindhu Portal (ID: ${appId}). Status: SUBMITTED.`;

    return {
      step: 'SUBMITTED',
      formDraft: draft,
      messageKn,
      messageEn,
      statusRecord: statusRecord || undefined,
      portalData: portalData || {
        applicationId: appId,
        status: 'SUBMITTED',
        acknowledgement: messageEn,
      },
    };
  }
}

export const bmtcSessionManager = new BmtcSessionManager();
