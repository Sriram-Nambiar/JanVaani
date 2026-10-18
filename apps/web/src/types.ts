export interface FormDraft {
  schemeId: string;
  schemeNameKn: string;
  schemeNameEn: string;
  extractedFields: Record<string, string | number>;
  missingFields: Array<{ key: string; labelKn: string; labelEn: string }>;
  isComplete: boolean;
  promptForCitizenKn: string;
}

export interface DocumentAudit {
  documentType: string;
  status: 'VERIFIED' | 'MISMATCH_DETECTED' | 'UNREADABLE';
  confidence: number;
  extractedMetadata: Record<string, string>;
  issues: string[];
  spokenVerdictKn: string;
  spokenVerdictEn: string;
}

export interface ApplicationTimelineStep {
  step: number;
  labelKn: string;
  labelEn: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'REJECTED';
  updatedAt?: string;
  office?: string;
}

export interface ApplicationStatus {
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

export interface WhatsAppMessagePayload {
  senderId?: string;
  type: 'voice' | 'image' | 'text';
  audioBase64?: string;
  audioUrl?: string;
  mimeType?: string;
  imageBase64?: string;
  imageUrl?: string;
  documentType?: 'aadhaar' | 'ration_card' | 'income_certificate' | 'generic';
  text?: string;
  presetScenario?: string;
}

export interface WhatsAppApiResponse {
  status: string;
  feature?: 'dhvani_form' | 'kagada_check' | 'audio_status_bell' | 'sarvam_chat';
  transcript?: string;
  formDraft?: FormDraft;
  auditResult?: DocumentAudit;
  statusRecord?: ApplicationStatus;
  audioBase64?: string;
  messageKn: string;
  messageEn: string;
  isMock: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'citizen' | 'janvaani';
  type: 'voice' | 'image' | 'text' | 'card';
  text?: string;
  transcript?: string;
  audioBase64?: string;
  imageUrl?: string;
  timestamp: string;
  feature?: 'dhvani_form' | 'kagada_check' | 'audio_status_bell' | 'sarvam_chat';
  formDraft?: FormDraft;
  auditResult?: DocumentAudit;
  statusRecord?: ApplicationStatus;
}
