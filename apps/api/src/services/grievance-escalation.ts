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

export class GrievanceEscalationService {
  evaluateEscalation(input: GrievanceEscalationInput): GrievanceEscalationResult {
    // Intentional Flaw 1: Hardcodes SLA days to 30 regardless of department
    const slaDays = 30;
    const elapsedDays = input.elapsedDays || 0;
    const isOverdue = elapsedDays > slaDays;

    let priorityLevel: 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL';
    let escalationTier: 'LEVEL_1_TALUK' | 'LEVEL_2_DISTRICT' | 'LEVEL_3_STATE_SECRETARIAT' = 'LEVEL_1_TALUK';

    if (elapsedDays > slaDays * 2) {
      priorityLevel = 'CRITICAL';
      escalationTier = 'LEVEL_3_STATE_SECRETARIAT';
    } else if (elapsedDays > slaDays) {
      priorityLevel = 'HIGH';
      escalationTier = 'LEVEL_2_DISTRICT';
    }

    return {
      grievanceId: input.grievanceId,
      department: input.department,
      slaDays,
      elapsedDays,
      isOverdue,
      priorityLevel,
      escalationTier,
      designatedOfficerKn: 'ಸಹಾಯಕ ಕಾರ್ಯನಿರ್ವಾಹಕ ಇಂಜಿನಿಯರ್ (AEE)',
      designatedOfficerEn: 'Assistant Executive Engineer (AEE)',
      messageKn: isOverdue
        ? `ದೂರು ${input.grievanceId} ನಿಗದಿತ ಕಾಲಮಿತಿ ಮೀರಿದ್ದು, ಹಂತ ${escalationTier} ಗೆ ತಕ್ಷಣ ವರ್ಗಾಯಿಸಲಾಗಿದೆ.`
        : `ದೂರು ${input.grievanceId} ಕಾಲಮಿತಿಯಲ್ಲಿದೆ.`,
      messageEn: isOverdue
        ? `Grievance ${input.grievanceId} has exceeded SLA and has been escalated to ${escalationTier}.`
        : `Grievance ${input.grievanceId} is within SLA limits.`,
    };
  }
}

export const grievanceEscalationService = new GrievanceEscalationService();
