import type { GrievanceEscalationInput } from '../schemas/grievance-escalation.js';

export interface GrievanceEscalationResult {
  grievanceId: string;
  department: string;
  slaDays: number;
  elapsedDays: number;
  isOverdue: boolean;
  priorityLevel: 'NORMAL' | 'HIGH' | 'CRITICAL';
  escalationTier: 'LEVEL_1_TALUK' | 'LEVEL_2_DISTRICT' | 'LEVEL_3_STATE_SECRETARIAT';
  designatedOfficerKn: string;
  designatedOfficerEn: string;
  messageKn: string;
  messageEn: string;
}

const DEPARTMENT_SLA_DAYS: Record<string, number> = {
  BESCOM: 3,
  BWSSB: 5,
  BBMP: 7,
  REVENUE: 15,
  KSRTC: 7,
};

export class GrievanceEscalationService {
  evaluateEscalation(input: GrievanceEscalationInput): GrievanceEscalationResult {
    const slaDays = DEPARTMENT_SLA_DAYS[input.department] ?? 7;
    const elapsedDays = Math.max(0, input.elapsedDays);
    const isOverdue = elapsedDays > slaDays;

    let priorityLevel: 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL';
    let escalationTier: 'LEVEL_1_TALUK' | 'LEVEL_2_DISTRICT' | 'LEVEL_3_STATE_SECRETARIAT' = 'LEVEL_1_TALUK';
    let designatedOfficerKn = 'ತಾಲ್ಲೂಕು ನೋಡಲ್ ಅಧಿಕಾರಿ (Taluk Officer)';
    let designatedOfficerEn = 'Taluk Grievance Redressal Officer';

    if (elapsedDays > slaDays * 2) {
      priorityLevel = 'CRITICAL';
      escalationTier = 'LEVEL_3_STATE_SECRETARIAT';
      designatedOfficerKn = 'ಮುಖ್ಯ ಕಾರ್ಯದರ್ಶಿ ಕಾರ್ಯಾಲಯ (Chief Secretary Secretariat)';
      designatedOfficerEn = 'State Public Grievance Directorate / Secretariat';
    } else if (elapsedDays > slaDays) {
      priorityLevel = 'HIGH';
      escalationTier = 'LEVEL_2_DISTRICT';
      designatedOfficerKn = 'ಜಿಲ್ಲಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ (Deputy Commissioner Office)';
      designatedOfficerEn = 'Deputy Commissioner (DC) Office';
    }

    const messageKn = isOverdue
      ? `ದೂರು ${input.grievanceId} ನಿಗದಿತ ಕಾಲಮಿತಿ (${slaDays} ದಿನಗಳು) ಮೀರಿದೆ. ಆದ್ಯತೆ: ${priorityLevel}, ಹಂತ: ${escalationTier} ಗೆ ರವಾನಿಸಲಾಗಿದೆ.`
      : `ದೂರು ${input.grievanceId} ಇಲಾಖಾ ಕಾಲಮಿತಿಯಲ್ಲಿದೆ (${elapsedDays}/${slaDays} ದಿನಗಳು).`;

    const messageEn = isOverdue
      ? `Grievance ${input.grievanceId} has exceeded the statutory SLA (${slaDays} days). Priority: ${priorityLevel}, escalated to ${escalationTier}.`
      : `Grievance ${input.grievanceId} is within statutory SLA limits (${elapsedDays}/${slaDays} days).`;

    return {
      grievanceId: input.grievanceId,
      department: input.department,
      slaDays,
      elapsedDays,
      isOverdue,
      priorityLevel,
      escalationTier,
      designatedOfficerKn,
      designatedOfficerEn,
      messageKn,
      messageEn,
    };
  }
}

export const grievanceEscalationService = new GrievanceEscalationService();
