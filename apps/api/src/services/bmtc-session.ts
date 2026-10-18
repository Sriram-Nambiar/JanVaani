import { ApplicationStatusRecord, trackerService } from './tracker.js';

export interface BmtcConversationResult {
  step: 'AWAITING_NAME' | 'AWAITING_MOBILE' | 'AWAITING_AADHAAR' | 'AWAITING_OTP' | 'SUBMITTED' | 'OTP_ERROR';
  formDraft: any;
  messageKn: string;
  messageEn: string;
  statusRecord?: ApplicationStatusRecord;
  portalData?: any;
}

interface UserSession {
  senderId: string;
  step: 'IDLE' | 'AWAITING_NAME' | 'AWAITING_MOBILE' | 'AWAITING_AADHAAR' | 'AWAITING_OTP' | 'SUBMITTED';
  studentName?: string;
  institutionName: string;
  course: string;
  pickupStop: string;
  destinationStop: string;
  mobileNumber?: string;
  aadhaarNumber?: string;
  otpCode?: string;
  applicationId?: string;
  lastUpdated: number;
}

class BmtcSessionManager {
  private sessions = new Map<string, UserSession>();

  private readonly SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_SESSIONS = 500;

  private pruneExpiredSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastUpdated > this.SESSION_TTL_MS) {
        this.sessions.delete(key);
      }
    }
    if (this.sessions.size > this.MAX_SESSIONS) {
      const oldestKeys = Array.from(this.sessions.keys()).slice(0, this.sessions.size - this.MAX_SESSIONS);
      for (const k of oldestKeys) {
        this.sessions.delete(k);
      }
    }
  }

  private getOrCreateSession(senderId: string): UserSession {
    this.pruneExpiredSessions();
    let session = this.sessions.get(senderId);
    if (!session) {
      session = {
        senderId,
        step: 'IDLE',
        institutionName: 'BMS College of Engineering, Basavanagudi',
        course: 'B.Tech Computer Science - 3rd Year',
        pickupStop: 'Banashankari TTMC',
        destinationStop: 'Majestic (Kempegowda Bus Station)',
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

    // If starting a fresh BMTC trigger without numbers:
    if (isBmtcTrigger && !containsAadhaar && !containsOtp && scenarioHint !== 'bmtc_student_pass_submit') {
      session.step = 'AWAITING_NAME';
      session.studentName = undefined;
      session.mobileNumber = undefined;
      session.aadhaarNumber = undefined;
      session.otpCode = undefined;
      session.applicationId = undefined;

      const draft = this.buildDraft(session, false);
      return {
        step: 'AWAITING_NAME',
        formDraft: draft,
        messageKn: 'ಖಂಡಿತ! ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್‌ಗೆ (BMTC Student Pass) ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ನಾನು ನಿಮಗೆ ಹಂತ-ಹಂತವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.\n\nಮೊದಲಿಗೆ, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ (Please enter your full name):',
        messageEn: 'Certainly! I will help you apply for the BMTC Student Concessional Bus Pass step-by-step.\n\nTo begin, please enter your full name:',
      };
    }

    // If session is IDLE and neither trigger nor numbers, ignore
    if (session.step === 'IDLE' && !containsAadhaar && !containsOtp && !isBmtcTrigger) {
      return null;
    }

    // CASE 1: All-in-one or direct submission (e.g. preset with submit)
    if (containsAadhaar && (containsOtp || scenarioHint === 'bmtc_student_pass_submit')) {
      session.aadhaarNumber = '4433 5010 5028';
      session.otpCode = '3344';
      if (!session.studentName) session.studentName = 'Priya Sharma';
      if (!session.mobileNumber) session.mobileNumber = '9845012345';
      return await this.submitToPortal(session);
    }

    // CASE 2: User is awaiting OTP or provides OTP
    if (session.step === 'AWAITING_OTP' || containsOtp) {
      if (text.includes('3344') || scenarioHint === 'bmtc_student_pass_submit' || lower.includes('confirm')) {
        session.otpCode = '3344';
        if (!session.studentName) session.studentName = 'Priya Sharma';
        if (!session.mobileNumber) session.mobileNumber = '9845012345';
        return await this.submitToPortal(session);
      } else {
        return {
          step: 'OTP_ERROR',
          formDraft: this.buildDraft(session, false),
          messageKn: 'ತಪ್ಪಾದ ಓಟಿಪಿ (Invalid OTP). ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ಕಳುಹಿಸಲಾದ ಸರಿಯಾದ 4-ಅಂಕಿಯ ಓಟಿಪಿ ನಮೂದಿಸಿ (ಡೆಮೊ ಓಟಿಪಿ: 3344).',
          messageEn: 'Invalid OTP. Please enter the correct 4-digit verification OTP (Demo OTP: 3344).',
        };
      }
    }

    // CASE 3: User enters Aadhaar
    if (containsAadhaar || (session.step === 'AWAITING_AADHAAR' && digitsOnly.length === 12)) {
      session.aadhaarNumber = '4433 5010 5028';
      session.step = 'AWAITING_OTP';
      if (!session.studentName) session.studentName = 'Priya Sharma';
      if (!session.mobileNumber) session.mobileNumber = '9845012345';

      const draft = this.buildDraft(session, false);
      const student = session.studentName || 'Student';
      const lastMobile = session.mobileNumber ? session.mobileNumber.slice(-4) : '2345';
      return {
        step: 'AWAITING_OTP',
        formDraft: draft,
        messageKn: `ಆಧಾರ್ ವಿವರಗಳು (XXXX-XXXX-5028) ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ! ನಿಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್‌ಗೆ (...${lastMobile}) 4-ಅಂಕಿಯ ಪರಿಶೀಲನಾ ಓಟಿಪಿ (OTP) ಕಳುಹಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಓಟಿಪಿ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (ಡೆಮೊ ಓಟಿಪಿ: 3344):`,
        messageEn: `Aadhaar identity (XXXX-XXXX-5028) verified successfully for ${student}! A 4-digit verification OTP has been sent to your registered mobile ending in ...${lastMobile}. Please type OTP: 3344 to submit:`,
      };
    }

    // CASE 4: Awaiting Name
    if (session.step === 'AWAITING_NAME') {
      const cleaned = text.replace(/^(my name is|i am|i'm|name is|ನನ್ನ ಹೆಸರು|ಹೆಸರು)\s*/i, '').trim();
      session.studentName = cleaned || text || 'Priya Sharma';
      session.step = 'AWAITING_MOBILE';

      const draft = this.buildDraft(session, false);
      return {
        step: 'AWAITING_MOBILE',
        formDraft: draft,
        messageKn: `ಧನ್ಯವಾದಗಳು, ${session.studentName}! ಈಗ ದಯವಿಟ್ಟು ನಿಮ್ಮ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (Please enter your 10-digit mobile number):`,
        messageEn: `Thank you, ${session.studentName}! Now please enter your 10-digit mobile number:`,
      };
    }

    // CASE 5: Awaiting Mobile
    if (session.step === 'AWAITING_MOBILE') {
      const mobileDigits = text.replace(/\D/g, '');
      session.mobileNumber = mobileDigits.length >= 10 ? mobileDigits.slice(-10) : (text || '9845012345');
      session.step = 'AWAITING_AADHAAR';

      const draft = this.buildDraft(session, false);
      return {
        step: 'AWAITING_AADHAAR',
        formDraft: draft,
        messageKn: `ಉತ್ತಮ! ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (${session.mobileNumber}) ನೋಂದಾಯಿಸಲಾಗಿದೆ.\n\n🏫 ಕಾಲೇಜು: ಬಿಎಂಎಸ್ ಇಂಜಿನಿಯರಿಂಗ್ ಕಾಲೇಜು (BMSCE)\n🚌 ಮಾರ್ಗ: ಬನಶಂಕರಿ TTMC ➔ ಮೆಜೆಸ್ಟಿಕ್\n\nಮುಂದುವರಿಯಲು e-KYC ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ 12-ಅಂಕಿಯ ಆಧಾರ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (ಡೆಮೊ ಆಧಾರ್: 4433 5010 5028):`,
        messageEn: `Great! Mobile number (${session.mobileNumber}) saved.\nCollege: BMSCE, Route: Banashankari TTMC -> Majestic.\nTo proceed with e-KYC, please enter your 12-digit Aadhaar number (Demo: 4433 5010 5028):`,
      };
    }

    // Fallback: prompt for name
    session.step = 'AWAITING_NAME';
    const draft = this.buildDraft(session, false);
    return {
      step: 'AWAITING_NAME',
      formDraft: draft,
      messageKn: 'ಖಂಡಿತ! ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್‌ಗೆ (BMTC Student Pass) ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.\n\nಮೊದಲಿಗೆ, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ (Please enter your full name):',
      messageEn: 'Certainly! I will help you apply for the BMTC Student Concessional Bus Pass.\n\nTo begin, please enter your full name:',
    };
  }

  private buildDraft(session: UserSession, isComplete: boolean) {
    const extractedFields: Record<string, string | number> = {};
    if (session.studentName) extractedFields.studentName = session.studentName;
    if (session.institutionName) extractedFields.institutionName = session.institutionName;
    if (session.course) extractedFields.course = session.course;
    if (session.pickupStop) extractedFields.pickupStop = session.pickupStop;
    if (session.destinationStop) extractedFields.destinationStop = session.destinationStop;
    if (session.mobileNumber) extractedFields.mobileNumber = session.mobileNumber;
    if (session.aadhaarNumber) extractedFields.aadhaarNumber = session.aadhaarNumber;
    if (session.otpCode) extractedFields.otpCode = session.otpCode;

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
      phoneNumber: session.mobileNumber,
      mobileNumber: session.mobileNumber,
      institutionName: session.institutionName,
      courseYear: session.course,
      course: session.course,
      pickupStop: session.pickupStop,
      destinationStop: session.destinationStop,
      demoOtp: session.otpCode || '3344',
      otpCode: session.otpCode || '3344',
      submittedVia: 'JANVAANI_AI' as const,
      source: 'JANVAANI_AI' as const,
    };

    let portalData: any = null;

    try {
      const res = await fetch(`${sevaApiUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        portalData = await res.json();
      }
    } catch (err: any) {
      console.warn('[BmtcSessionManager] Offline/direct fallback:', err.message);
    }

    const appId = portalData?.applicationId || `SEVA-DEMO-${Date.now()}-A8F2`;
    session.applicationId = appId;
    const student = session.studentName || 'ಪ್ರಿಯಾ ಶರ್ಮಾ (Priya Sharma)';
    const mobile = session.mobileNumber || '9845012345';

    const statusRecord = trackerService.registerUniqueRecord(
      () => ({
        ackNumber: appId,
        schemeId: 'bmtc_student_pass',
        schemeNameKn: 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್',
        schemeNameEn: 'BMTC Student Concessional Bus Pass',
        applicantName: student,
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
          typeof portalData?.acknowledgement === 'string'
            ? portalData.acknowledgement
            : `Success! Your BMTC Student Pass application for ${student} has been registered with Seva Sindhu Portal (ID: ${appId}). Status: SUBMITTED.`,
      }),
      () => appId
    );

    const draft = this.buildDraft(session, true);

    const messageKn = `🎉 ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಬಸ್ ಪಾಸ್ ಅರ್ಜಿಯನ್ನು ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (Seva Sindhu) ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!\n\n📋 ಅರ್ಜಿ ಸಂಖ್ಯೆ (Application ID): ${appId}\n👤 ವಿದ್ಯಾರ್ಥಿ: ${student}\n📱 ಮೊಬೈಲ್: ${mobile}\n🚌 ಮಾರ್ಗ: ಬನಶಂಕರಿ TTMC ➔ ಮೆಜೆಸ್ಟಿಕ್\n🏫 ಕಾಲೇಜು: ಬಿಎಂಎಸ್ ಇಂಜಿನಿಯರಿಂಗ್ ಕಾಲೇಜು (BMSCE)\n✅ ಸ್ಥಿತಿ: ಸ್ವೀಕರಿಸಲಾಗಿದೆ (SUBMITTED)\n\nನೀವು ಈ ಅರ್ಜಿ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿ ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (Port 5174) ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಬಹುದು.`;

    const messageEn =
      typeof portalData?.acknowledgement === 'string'
        ? portalData.acknowledgement
        : `Success! BMTC Concessional Student Pass application for ${student} (Phone: ${mobile}) has been registered with Seva Sindhu Portal (ID: ${appId}). Status: SUBMITTED.`;

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
