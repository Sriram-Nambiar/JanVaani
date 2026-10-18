export interface BmtcApplicationPayload {
  studentName: string;
  aadhaarNumber: string;
  mobileNumber: string;
  institutionName: string;
  course: string;
  pickupStop: string;
  destinationStop: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  address?: string;
  pincode?: string;
  admissionNo?: string;
  otpCode?: string;
  documents?: {
    photoUploaded: boolean;
    feeReceiptUploaded: boolean;
    aadhaarProofUploaded: boolean;
    residentialProofUploaded: boolean;
  };
  source?: 'SEVA_SINDHU_PORTAL' | 'JANVAANI_AI';
}

export interface BmtcApplicationResponse {
  applicationId: string;
  serviceId: string;
  serviceName: string;
  status: 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'REJECTED';
  applicant: {
    studentName: string;
    aadhaarMasked: string;
    mobileNumber: string;
    institutionName: string;
    course: string;
    pickupStop: string;
    destinationStop: string;
  };
  submittedAt: string;
  estimatedResolutionDate: string;
  acknowledgement: string;
  source: string;
  history?: Array<{
    status: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export interface ServiceItem {
  id: string;
  title: string;
  titleKn: string;
  department: string;
  departmentKn: string;
  description: string;
  fee: string;
  processingTime: string;
  icon: string;
  isPopular?: boolean;
}
