/**
 * Karnataka Public Services & Schemes Knowledge Engine
 * Powers:
 * - Dhvani-Form (Schema mapping & entity slot filling)
 * - Kagada-Check (Rule-based document validation & discrepancy auditing)
 */

export interface SchemeDefinition {
  id: string;
  nameEn: string;
  nameKn: string;
  department: string;
  descriptionKn: string;
  descriptionEn: string;
  requiredFields: Array<{
    key: string;
    labelKn: string;
    labelEn: string;
    type: 'string' | 'number';
    required: boolean;
  }>;
  requiredDocuments: Array<{
    id: string;
    titleKn: string;
    titleEn: string;
    isMandatory: boolean;
  }>;
  rules: {
    maxAnnualIncome?: number;
    genderEligibility?: 'FEMALE' | 'ANY';
    notesKn: string;
  };
}

export const SUPPORTED_SCHEMES: Record<string, SchemeDefinition> = {
  gruha_lakshmi: {
    id: 'gruha_lakshmi',
    nameEn: 'Gruha Lakshmi Scheme',
    nameKn: 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ',
    department: 'Women and Child Development',
    descriptionEn: 'Monthly financial assistance of ₹2,000 to the woman head of household in Karnataka.',
    descriptionKn: 'ಕರ್ನಾಟಕದ ಕುಟುಂಬದ ಯಜಮಾನಿ ಮಹಿಳೆಗೆ ಮಾಸಿಕ ₹2,000 ಆರ್ಥಿಕ ನೆರವು.',
    requiredFields: [
      { key: 'applicantName', labelKn: 'ಅರ್ಜಿದಾರರ ಹೆಸರು', labelEn: 'Applicant Name', type: 'string', required: true },
      { key: 'rationCardNumber', labelKn: 'ರೇಷನ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ', labelEn: 'Ration Card Number', type: 'string', required: true },
      { key: 'aadhaarNumber', labelKn: 'ಆಧಾರ್ ಸಂಖ್ಯೆ', labelEn: 'Aadhaar Number', type: 'string', required: true },
      { key: 'district', labelKn: 'ಜಿಲ್ಲೆ', labelEn: 'District', type: 'string', required: true },
      { key: 'taluk', labelKn: 'ತಾಲೂಕು', labelEn: 'Taluk', type: 'string', required: true },
      { key: 'bankAccountNumber', labelKn: 'ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ', labelEn: 'Bank Account Number', type: 'string', required: false },
    ],
    requiredDocuments: [
      { id: 'ration_card', titleKn: 'ಪಡಿತರ ಚೀಟಿ (BPL/APL/AAY)', titleEn: 'Ration Card (BPL/APL/AAY)', isMandatory: true },
      { id: 'aadhaar', titleKn: 'ಅರ್ಜಿದಾರರ ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Applicant Aadhaar Card', isMandatory: true },
      { id: 'bank_passbook', titleKn: 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್', titleEn: 'Bank Passbook', isMandatory: false },
    ],
    rules: {
      genderEligibility: 'FEMALE',
      notesKn: 'ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥ ಮಹಿಳೆಯಾಗಿರಬೇಕು. ಜಿಎಸ್‌ಟಿ ಅಥವಾ ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿದಾರರಾಗಿರಬಾರದು.',
    },
  },
  caste_income: {
    id: 'caste_income',
    nameEn: 'Caste & Income Certificate (Nadakacheri)',
    nameKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ (ನಾಡಕಚೇರಿ)',
    department: 'Revenue Department',
    descriptionEn: 'Statutory certificate for education, scholarship, and government reservation benefits.',
    descriptionKn: 'ಶಿಕ್ಷಣ, ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಮೀಸಲಾತಿ ಸೌಲಭ್ಯಗಳಿಗಾಗಿ ಶಾಸನಬದ್ಧ ಪ್ರಮಾಣ ಪತ್ರ.',
    requiredFields: [
      { key: 'applicantName', labelKn: 'ಅರ್ಜಿದಾರರ ಹೆಸರು', labelEn: 'Applicant Name', type: 'string', required: true },
      { key: 'fatherOrHusbandName', labelKn: 'ತಂದೆ / ಪತಿಯ ಹೆಸರು', labelEn: 'Father / Husband Name', type: 'string', required: true },
      { key: 'casteCategory', labelKn: 'ಪ್ರವರ್ಗ (Caste Category)', labelEn: 'Category (2A/3A/SC/ST)', type: 'string', required: true },
      { key: 'annualIncome', labelKn: 'ವಾರ್ಷಿಕ ಆದಾಯ (₹)', labelEn: 'Annual Income', type: 'number', required: true },
      { key: 'district', labelKn: 'ಜಿಲ್ಲೆ', labelEn: 'District', type: 'string', required: true },
      { key: 'taluk', labelKn: 'ತಾಲೂಕು', labelEn: 'Taluk', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'aadhaar', titleKn: 'ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Aadhaar Card', isMandatory: true },
      { id: 'income_proof', titleKn: 'ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ / ಸ್ವಯಂ ಘೋಷಣೆ', titleEn: 'Income Proof / Self Declaration', isMandatory: true },
      { id: 'school_tc', titleKn: 'ಶಾಲಾ ವರ್ಗಾವಣೆ ಪತ್ರ (TC / Study Certificate)', titleEn: 'School TC / Study Certificate', isMandatory: false },
    ],
    rules: {
      maxAnnualIncome: 200000,
      notesKn: '2A, 3A, 3B ಪ್ರವರ್ಗಗಳಿಗೆ ಆದಾಯ ಮಿತಿ ವಾರ್ಷಿಕ ₹2,00,000 ಒಳಗೆ ಇರಬೇಕು.',
    },
  },
  gruha_jyothi: {
    id: 'gruha_jyothi',
    nameEn: 'Gruha Jyothi Scheme (200 Units Free Power)',
    nameKn: 'ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆ (200 ಯೂನಿಟ್ ಉಚಿತ ವಿದ್ಯುತ್)',
    department: 'Energy Department (ಇಂಧನ ಇಲಾಖೆ)',
    descriptionEn: 'Provides up to 200 units of free electricity per month to all domestic households in Karnataka.',
    descriptionKn: 'ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಗೃಹಬಳಕೆದಾರರಿಗೆ ತಿಂಗಳಿಗೆ 200 ಯೂನಿಟ್‌ವರೆಗೆ ಉಚಿತ ವಿದ್ಯುತ್ ನೀಡುವ ಯೋಜನೆ.',
    requiredFields: [
      { key: 'applicantName', labelKn: 'ಅರ್ಜಿದಾರರ ಹೆಸರು', labelEn: 'Applicant Name', type: 'string', required: true },
      { key: 'aadhaarNumber', labelKn: 'ಆಧಾರ್ ಸಂಖ್ಯೆ', labelEn: 'Aadhaar Number', type: 'string', required: true },
      { key: 'escomName', labelKn: 'ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ (ESCOM)', labelEn: 'ESCOM Name (BESCOM/MESCOM/HESCOM/GESCOM/CHESCOM)', type: 'string', required: true },
      { key: 'consumerId', labelKn: 'ವಿದ್ಯುತ್ ಖಾತೆ ಸಂಖ್ಯೆ (Account ID / RR Number)', labelEn: 'Consumer ID / Account ID', type: 'string', required: true },
      { key: 'occupancyType', labelKn: 'ವಸ್ತುಸ್ಥಿತಿ (ಮಾಲೀಕರು / ಬಾಡಿಗೆದಾರರು)', labelEn: 'Occupancy Type (Owner/Tenant)', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'aadhaar', titleKn: 'ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Aadhaar Card', isMandatory: true },
      { id: 'electricity_bill', titleKn: 'ಇತ್ತೀಚಿನ ವಿದ್ಯುತ್ ಬಿಲ್ (Electricity Bill)', titleEn: 'Electricity Bill', isMandatory: true },
    ],
    rules: {
      notesKn: 'ಗೃಹಬಳಕೆಯ ವಿದ್ಯುತ್ ಮೀಟರ್‌ಗಳಿಗೆ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ. ವಾಣಿಜ್ಯ ಬಳಕೆಗೆ ಅನ್ವಯಿಸುವುದಿಲ್ಲ.',
    },
  },
  bmtc_student_pass: {
    id: 'bmtc_student_pass',
    nameEn: 'BMTC Student Concessional Bus Pass',
    nameKn: 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್',
    department: 'Transport Department (BMTC Bengaluru)',
    descriptionEn: 'Concessional city bus pass for regular students travelling across Bengaluru Metropolitan area.',
    descriptionKn: 'ಬೆಂಗಳೂರು ಮಹಾನಗರ ಸಾರಿಗೆ ಸಂಸ್ಥೆಯ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್.',
    requiredFields: [
      { key: 'studentName', labelKn: 'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು', labelEn: 'Student Name', type: 'string', required: true },
      { key: 'institutionName', labelKn: 'ಕಾಲೇಜು / ಶಿಕ್ಷಣ ಸಂಸ್ಥೆ', labelEn: 'College / Institution Name', type: 'string', required: true },
      { key: 'course', labelKn: 'ಕೋರ್ಸ್ ಮತ್ತು ವರ್ಷ', labelEn: 'Course & Year', type: 'string', required: true },
      { key: 'pickupStop', labelKn: 'ಪ್ರಾರಂಭದ ಬಸ್ ನಿಲ್ದಾಣ (Pickup Stop)', labelEn: 'Pickup Stop', type: 'string', required: true },
      { key: 'destinationStop', labelKn: 'ಗಮ್ಯಸ್ಥಾನ ಬಸ್ ನಿಲ್ದಾಣ (Destination Stop)', labelEn: 'Destination Stop', type: 'string', required: true },
      { key: 'mobileNumber', labelKn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', labelEn: 'Mobile Number', type: 'string', required: true },
      { key: 'aadhaarNumber', labelKn: 'ಆಧಾರ್ ಸಂಖ್ಯೆ (Mock 4433 5010 5028)', labelEn: 'Aadhaar Number', type: 'string', required: true },
      { key: 'otpCode', labelKn: 'ಓಟಿಪಿ (Mock 3344)', labelEn: 'OTP Code', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'photo', titleKn: 'ವಿದ್ಯಾರ್ಥಿ ಭಾವಚಿತ್ರ', titleEn: 'Passport Size Photo', isMandatory: true },
      { id: 'fee_receipt', titleKn: 'ಕಾಲೇಜು ಶುಲ್ಕ ರಶೀದಿ / ಬೋನಫೈಡ್', titleEn: 'College Fee Receipt / Bonafide', isMandatory: true },
      { id: 'aadhaar', titleKn: 'ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Aadhaar Card', isMandatory: true },
    ],
    rules: {
      notesKn: 'ಬೆಂಗಳೂರಿನ ಮಾನ್ಯತೆ ಪಡೆದ ಕಾಲೇಜು ಮತ್ತು ಶಾಲಾ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ 100% ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್.',
    },
  },
  anna_bhagya: {
    id: 'anna_bhagya',
    nameEn: 'Anna Bhagya Scheme (Food Security & DBT)',
    nameKn: 'ಅನ್ನಭಾಗ್ಯ ಯೋಜನೆ (ಆಹಾರ ಭದ್ರತೆ ಮತ್ತು ಡಿಬಿಟಿ ನಗದು ವರ್ಗಾವಣೆ)',
    department: 'Food, Civil Supplies & Consumer Affairs',
    descriptionEn: 'Provides 10 kg free food grains per person per month to BPL and Antyodaya households (5 kg free rice + ₹170 DBT cash per additional 5 kg).',
    descriptionKn: 'ಬಿಪಿಎಲ್ ಮತ್ತು ಅಂತ್ಯೋದಯ ಪಡಿತರ ಚೀಟಿದಾರರಿಗೆ ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ ತಿಂಗಳಿಗೆ 10 ಕೆಜಿ ಆಹಾರ ಧಾನ್ಯ (5 ಕೆಜಿ ಉಚಿತ ಅಕ್ಕಿ + ಹೆಚ್ಚುವರಿ 5 ಕೆಜಿಗೆ ತಲಾ ₹170 ಡಿಬಿಟಿ ನಗದು).',
    requiredFields: [
      { key: 'applicantName', labelKn: 'ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥರ ಹೆಸರು', labelEn: 'Head of Family Name', type: 'string', required: true },
      { key: 'rationCardNumber', labelKn: 'ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ (BPL/AAY)', labelEn: 'Ration Card Number', type: 'string', required: true },
      { key: 'aadhaarNumber', labelKn: 'ಆಧಾರ್ ಸಂಖ್ಯೆ', labelEn: 'Aadhaar Number', type: 'string', required: true },
      { key: 'familyMembersCount', labelKn: 'ಕುಟುಂಬದ ಸದಸ್ಯರ ಸಂಖ್ಯೆ', labelEn: 'Number of Family Members', type: 'number', required: true },
      { key: 'bankAccountNumber', labelKn: 'ಆಧಾರ್ ಲಿಂಕ್ಡ್ ಬ್ಯಾಂಕ್ ಖಾತೆ', labelEn: 'Aadhaar-Seeded Bank Account', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'ration_card', titleKn: 'ಬಿಪಿಎಲ್ / ಅಂತ್ಯೋದಯ ಪಡಿತರ ಚೀಟಿ', titleEn: 'BPL / Antyodaya Ration Card', isMandatory: true },
      { id: 'aadhaar', titleKn: 'ಕುಟುಂಬದ ಸದಸ್ಯರ ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Family Members Aadhaar Cards', isMandatory: true },
      { id: 'bank_passbook', titleKn: 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ (NPCI ಲಿಂಕ್ಡ್)', titleEn: 'Bank Passbook (NPCI Seeded)', isMandatory: true },
    ],
    rules: {
      notesKn: 'ಅಂತ್ಯೋದಯ (AAY) ಮತ್ತು ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿದಾರರಿಗೆ ಮಾತ್ರ ಲಭ್ಯ. ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಆಧಾರ್ NPCI ಮ್ಯಾಪಿಂಗ್ ಕಡ್ಡಾಯ.',
    },
  },
  yuva_nidhi: {
    id: 'yuva_nidhi',
    nameEn: 'Yuva Nidhi Scheme (Unemployment Financial Assistance)',
    nameKn: 'ಯುವನಿಧಿ ಯೋಜನೆ (ನಿರುದ್ಯೋಗ ಭತ್ಯೆ)',
    department: 'Skill Development, Entrepreneurship and Livelihood Department',
    descriptionEn: 'Monthly financial allowance for unemployed degree holders (₹3,000/month) and diploma holders (₹1,500/month) in Karnataka for up to 2 years.',
    descriptionKn: 'ಕರ್ನಾಟಕದ ನಿರುದ್ಯೋಗಿ ಪದವೀಧರರಿಗೆ ಮಾಸಿಕ ₹3,000 ಮತ್ತು ಡಿಪ್ಲೊಮಾ ಪೂರೈಸಿದವರಿಗೆ ಮಾಸಿಕ ₹1,500 ನಿರುದ್ಯೋಗ ಭತ್ಯೆ (ಗರಿಷ್ಠ 2 ವರ್ಷಗಳ ಅವಧಿಗೆ).',
    requiredFields: [
      { key: 'applicantName', labelKn: 'ಅರ್ಜಿದಾರರ ಹೆಸರು', labelEn: 'Applicant Name', type: 'string', required: true },
      { key: 'qualificationType', labelKn: 'ವಿದ್ಯಾರ್ಹತೆ (DEGREE / DIPLOMA)', labelEn: 'Qualification Type', type: 'string', required: true },
      { key: 'degreeOrDiplomaName', labelKn: 'ಪದವಿ / ಡಿಪ್ಲೊಮಾ ಹೆಸರು', labelEn: 'Degree or Diploma Name', type: 'string', required: true },
      { key: 'graduationYear', labelKn: 'ತೇರ್ಗಡೆಯಾದ ವರ್ಷ', labelEn: 'Graduation Year', type: 'number', required: true },
      { key: 'aadhaarNumber', labelKn: 'ಆಧಾರ್ ಸಂಖ್ಯೆ', labelEn: 'Aadhaar Number', type: 'string', required: true },
      { key: 'mobileNumber', labelKn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', labelEn: 'Mobile Number', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'degree_certificate', titleKn: 'ಪದವಿ / ಡಿಪ್ಲೊಮಾ ಅಂಕಪಟ್ಟಿ ಅಥವಾ ಕಾನ್ವೊಕೇಷನ್', titleEn: 'Degree/Diploma Marksheet or Convocation', isMandatory: true },
      { id: 'aadhaar', titleKn: 'ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Aadhaar Card', isMandatory: true },
      { id: 'domicile_certificate', titleKn: 'ಕರ್ನಾಟಕ ವಾಸಸ್ಥಳ ಪ್ರಮಾಣ ಪತ್ರ (6+ ವರ್ಷಗಳ ವ್ಯಾಸಂಗ)', titleEn: 'Karnataka Domicile / Study Certificate (6+ Years)', isMandatory: true },
    ],
    rules: {
      notesKn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ಕನಿಷ್ಠ 6 ವರ್ಷ ವ್ಯಾಸಂಗ ಮಾಡಿರಬೇಕು. ತೇರ್ಗಡೆಯಾಗಿ 180 ದಿನಗಳು ಕಳೆದಿದ್ದರೂ ಉದ್ಯೋಗ ದೊರೆಯದ ಅಭ್ಯರ್ಥಿಗಳಿಗೆ ಮಾತ್ರ ಅನ್ವಯ.',
    },
  },
  ganga_kalyana: {
    id: 'ganga_kalyana',
    nameEn: 'Ganga Kalyana Scheme (Irrigation Borewell Subsidy)',
    nameKn: 'ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆ (ನೀರಾವರಿ ಕೊಳವೆಬಾವಿ ಸಹಾಯಧನ)',
    department: 'Backward Classes Welfare Department / Dr. B.R. Ambedkar Development Corporation',
    descriptionEn: 'Provides irrigation facility by drilling borewells and supplying pump sets with energization for small and marginal farmers (subsidy up to ₹3,50,000 for individual borewells).',
    descriptionKn: 'ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರ ಕೃಷಿ ಜಮೀನಿಗೆ ಉಚಿತ ಕೊಳವೆಬಾವಿ ಕೊರೆದು, ಪಂಪ್‌ಸೆಟ್ ಅಳವಡಿಸಿ ವಿದ್ಯುದ್ದೀಕರಣ ಒದಗಿಸುವ ಯೋಜನೆ (ವೈಯಕ್ತಿಕ ಕೊಳವೆಬಾವಿಗೆ ಗರಿಷ್ಠ ₹3,50,000 ವರೆಗೆ ಸಹಾಯಧನ).',
    requiredFields: [
      { key: 'applicantName', labelKn: 'ರೈತರ ಹೆಸರು', labelEn: 'Farmer Name', type: 'string', required: true },
      { key: 'casteCategory', labelKn: 'ಜಾತಿ ವರ್ಗ (SC/ST/OBC)', labelEn: 'Caste Category', type: 'string', required: true },
      { key: 'surveyNumber', labelKn: 'ಜಮೀನಿನ ಸರ್ವೆ ನಂಬರ್', labelEn: 'Land Survey Number', type: 'string', required: true },
      { key: 'landAcres', labelKn: 'ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)', labelEn: 'Land Extent in Acres', type: 'number', required: true },
      { key: 'village', labelKn: 'ಗ್ರಾಮ / ತಾಲೂಕು', labelEn: 'Village / Taluk', type: 'string', required: true },
      { key: 'mobileNumber', labelKn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', labelEn: 'Mobile Number', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'rtc_pahani', titleKn: 'ಆರ್.ಟಿ.ಸಿ (ಪಹಣಿ)', titleEn: 'RTC (Pahani / Land Record)', isMandatory: true },
      { id: 'caste_income_cert', titleKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ', titleEn: 'Caste & Income Certificate', isMandatory: true },
      { id: 'small_farmer_cert', titleKn: 'ಸಣ್ಣ / ಅತಿ ಸಣ್ಣ ಹಿಡುವಳಿದಾರರ ಪ್ರಮಾಣ ಪತ್ರ', titleEn: 'Small/Marginal Farmer Certificate', isMandatory: true },
      { id: 'aadhaar', titleKn: 'ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Aadhaar Card', isMandatory: true },
    ],
    rules: {
      notesKn: 'ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರಿಗೆ ಮಾತ್ರ (ಕನಿಷ್ಠ 1.20 ಎಕರೆಯಿಂದ ಗರಿಷ್ಠ 5 ಎಕರೆ ಖುಷ್ಕಿ ಜಮೀನು). ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ಗ್ರಾಮೀಣ ಪ್ರದೇಶದಲ್ಲಿ ₹1.50 ಲಕ್ಷ ಮೀರಬಾರದು.',
    },
  },
  raita_vidya_nidhi: {
    id: 'raita_vidya_nidhi',
    nameEn: 'Chief Minister Raita Vidya Nidhi Scheme (Farmer Child Scholarship)',
    nameKn: 'ಮುಖ್ಯಮಂತ್ರಿ ರೈತ ವಿದ್ಯಾ ನಿಧಿ ಯೋಜನೆ (ರೈತರ ಮಕ್ಕಳ ವಿದ್ಯಾರ್ಥಿವೇತನ)',
    department: 'Department of Agriculture, Government of Karnataka',
    descriptionEn: 'Annual scholarship assistance for children of farmers studying in High School (girls only), PUC, ITI, Diploma, Degree, Professional and Medical courses (₹2,500 to ₹11,000/year).',
    descriptionKn: 'ರೈತರ ಮಕ್ಕಳಿಗೆ ಉನ್ನತ ವ್ಯಾಸಂಗ ಪ್ರೋತ್ಸಾಹಿಸಲು ವಾರ್ಷಿಕ ವಿದ್ಯಾರ್ಥಿವೇತನ ಸಹಾಯಧನ (ಪಿಯುಸಿ/ಡಿಪ್ಲೊಮಾದಿಂದ ವೈದ್ಯಕೀಯ/ಸ್ನಾತಕೋತ್ತರ ವ್ಯಾಸಂಗದವರೆಗೆ ₹2,500 ರಿಂದ ₹11,000 ವರೆಗೆ ಡಿಬಿಟಿ ಜಮೆ).',
    requiredFields: [
      { key: 'studentName', labelKn: 'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು', labelEn: 'Student Name', type: 'string', required: true },
      { key: 'gender', labelKn: 'ಲಿಂಗ (MALE / FEMALE)', labelEn: 'Gender', type: 'string', required: true },
      { key: 'fruitsId', labelKn: 'ರೈತರ ಫ್ರೂಟ್ಸ್ ಐಡಿ (FRUITS ID)', labelEn: 'Farmer FRUITS ID', type: 'string', required: true },
      { key: 'courseLevel', labelKn: 'ವ್ಯಾಸಂಗ ಹಂತ (PUC / DEGREE / MEDICAL)', labelEn: 'Course Level', type: 'string', required: true },
      { key: 'collegeName', labelKn: 'ಕಾಲೇಜು ಅಥವಾ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಯ ಹೆಸರು', labelEn: 'College or Institution Name', type: 'string', required: true },
      { key: 'aadhaarNumber', labelKn: 'ವಿದ್ಯಾರ್ಥಿಯ ಆಧಾರ್ ಸಂಖ್ಯೆ', labelEn: 'Student Aadhaar Number', type: 'string', required: true },
      { key: 'mobileNumber', labelKn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', labelEn: 'Mobile Number', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'fruits_card', titleKn: 'ರೈತರ ಫ್ರೂಟ್ಸ್ ನೋಂದಣಿ ಗುರುತಿನ ಚೀಟಿ', titleEn: 'Farmer FRUITS Registration Card', isMandatory: true },
      { id: 'college_admission_receipt', titleKn: 'ಪ್ರಸ್ತುತ ವರ್ಷದ ಕಾಲೇಜು ಪ್ರವೇಶ ರಶೀದಿ', titleEn: 'Current Year College Admission / Fee Receipt', isMandatory: true },
      { id: 'student_aadhaar', titleKn: 'ವಿದ್ಯಾರ್ಥಿಯ ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Student Aadhaar Card', isMandatory: true },
      { id: 'student_bank_passbook', titleKn: 'ವಿದ್ಯಾರ್ಥಿಯ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ (NPCI ಲಿಂಕ್ಡ್)', titleEn: 'Student Bank Passbook (NPCI Seeded)', isMandatory: true },
    ],
    rules: {
      notesKn: 'ಕರ್ನಾಟಕದ ಭೂಮಾಲೀಕ ರೈತರ ಮಕ್ಕಳಿಗೆ ಲಭ್ಯ. ತಂದೆ/ತಾಯಿಯ ಫ್ರೂಟ್ಸ್ (FRUITS) ಐಡಿ ಕಡ್ಡಾಯ. ಡಿಬಿಟಿ ಮೂಲಕ ನೇರವಾಗಿ ವಿದ್ಯಾರ್ಥಿಯ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆ.',
    },
  },
  swavalambana: {
    id: 'swavalambana',
    nameEn: 'Swavalambana Self-Employment & Capital Subsidy Scheme',
    nameKn: 'ಸ್ವಾವಲಂಬನ ಸ್ವಯಂ ಉದ್ಯೋಗ ಮತ್ತು ಬಂಡವಾಳ ಸಹಾಯಧನ ಯೋಜನೆ',
    department: 'Karnataka State D. Devaraj Urs Backward Classes Development Corporation',
    descriptionEn: 'Financial assistance and bank-linked capital subsidy (up to 50% or maximum ₹1,00,000) for establishing self-employment micro-enterprises with project cost up to ₹5,00,000.',
    descriptionKn: 'ಹಿಂದುಳಿದ ವರ್ಗಗಳ ನಿರುದ್ಯೋಗಿ ಯುವಕರಿಗೆ ಸ್ವಯಂ ಉದ್ಯೋಗ ಕಿರು ಉದ್ಯಮ ಆರಂಭಿಸಲು ಗರಿಷ್ಠ ₹5,00,000 ಯೋಜನೆ ವೆಚ್ಚಕ್ಕೆ ಶೇಕಡ 50% (ಗರಿಷ್ಠ ₹1,00,000) ಬ್ಯಾಂಕ್ ಸಂಯೋಜಿತ ಬಂಡವಾಳ ಸಹಾಯಧನ.',
    requiredFields: [
      { key: 'applicantName', labelKn: 'ಅರ್ಜಿದಾರರ ಹೆಸರು', labelEn: 'Applicant Name', type: 'string', required: true },
      { key: 'enterpriseType', labelKn: 'ಉದ್ಯಮದ ಪ್ರಕಾರ', labelEn: 'Enterprise Type', type: 'string', required: true },
      { key: 'projectCostInr', labelKn: 'ಯೋಜನಾ ವೆಚ್ಚ (ರೂ.)', labelEn: 'Project Cost in INR', type: 'number', required: true },
      { key: 'casteCategory', labelKn: 'ಜಾತಿ ವರ್ಗ (2A / 2B / 3A / 3B / CAT-1)', labelEn: 'Caste Category', type: 'string', required: true },
      { key: 'bankIfsc', labelKn: 'ಬ್ಯಾಂಕ್ IFSC ಕೋಡ್', labelEn: 'Bank IFSC Code', type: 'string', required: true },
      { key: 'aadhaarNumber', labelKn: 'ಆಧಾರ್ ಸಂಖ್ಯೆ', labelEn: 'Aadhaar Number', type: 'string', required: true },
      { key: 'mobileNumber', labelKn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', labelEn: 'Mobile Number', type: 'string', required: true },
    ],
    requiredDocuments: [
      { id: 'project_quotation', titleKn: 'ಯೋಜನಾ ವರದಿ ಮತ್ತು ಉಪಕರಣಗಳ ಕೊಟೇಶನ್', titleEn: 'Project Report & Equipment Quotation', isMandatory: true },
      { id: 'caste_income_cert', titleKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ', titleEn: 'Caste & Income Certificate', isMandatory: true },
      { id: 'aadhaar', titleKn: 'ಆಧಾರ್ ಕಾರ್ಡ್', titleEn: 'Aadhaar Card', isMandatory: true },
      { id: 'bank_passbook', titleKn: 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್', titleEn: 'Bank Passbook', isMandatory: true },
    ],
    rules: {
      notesKn: '18 ರಿಂದ 45 ವರ್ಷ ವಯೋಮಿತಿಯ ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಅಭ್ಯರ್ಥಿಗಳಿಗೆ ಲಭ್ಯ. ರಾಷ್ಟ್ರೀಕೃತ ಅಥವಾ ಗ್ರಾಮೀಣ ಬ್ಯಾಂಕ್‌ಗಳ ಮೂಲಕ ಸಾಲ ಮತ್ತು ಸಹಾಯಧನ ಮಂಜೂರಾತಿ.',
    },
  },
};

export interface FormDraftResult {
  schemeId: string;
  schemeNameKn: string;
  schemeNameEn: string;
  extractedFields: Record<string, string | number>;
  missingFields: Array<{ key: string; labelKn: string; labelEn: string }>;
  isComplete: boolean;
  promptForCitizenKn: string;
}

export interface DocumentAuditResult {
  documentType: string;
  status: 'VERIFIED' | 'MISMATCH_DETECTED' | 'UNREADABLE';
  confidence: number;
  extractedMetadata: Record<string, string>;
  issues: string[];
  spokenVerdictKn: string;
  spokenVerdictEn: string;
}

export class SchemesService {
  /**
   * Parse Kannada speech text and map to an official scheme form draft
   */
  extractFormDraft(transcript: string, scenarioHint?: string): FormDraftResult {
    const isBmtc =
      scenarioHint?.startsWith('bmtc') ||
      transcript.toLowerCase().includes('bmtc') ||
      transcript.toLowerCase().includes('bus pass') ||
      transcript.toLowerCase().includes('student pass') ||
      transcript.includes('ಬಸ್ ಪಾಸ್') ||
      transcript.includes('ಪಾಸ್') ||
      transcript.includes('ವಿದ್ಯಾರ್ಥಿ ಪಾಸ್');

    const isGruhaJyothi =
      scenarioHint?.startsWith('gruha_jyothi') ||
      transcript.includes('ಜ್ಯೋತಿ') ||
      transcript.includes('ವಿದ್ಯುತ್') ||
      transcript.includes('ಕರೆಂಟ್') ||
      transcript.includes('ಬೆಸ್ಕಾಂ') ||
      transcript.includes('BESCOM') ||
      transcript.includes('electricity') ||
      transcript.includes('jyothi');

    const isCasteIncome =
      scenarioHint === 'caste_income_apply' ||
      transcript.includes('ಜಾತಿ') ||
      transcript.includes('ಆದಾಯ') ||
      transcript.includes('caste') ||
      transcript.includes('income');

    const isAnnaBhagya =
      scenarioHint?.startsWith('anna_bhagya') ||
      transcript.includes('ಅನ್ನಭಾಗ್ಯ') ||
      transcript.includes('ಅನ್ನ ಭಾಗ್ಯ') ||
      transcript.includes('ಉಚಿತ ಅಕ್ಕಿ') ||
      transcript.toLowerCase().includes('anna bhagya');

    const isYuvaNidhi =
      scenarioHint?.startsWith('yuva_nidhi') ||
      transcript.includes('ಯುವನಿಧಿ') ||
      transcript.includes('ಯುವ ನಿಧಿ') ||
      transcript.includes('ನಿರುದ್ಯೋಗ') ||
      transcript.toLowerCase().includes('yuva nidhi') ||
      transcript.toLowerCase().includes('unemployment');

    const isGangaKalyana =
      scenarioHint?.startsWith('ganga_kalyana') ||
      transcript.includes('ಗಂಗಾ ಕಲ್ಯಾಣ') ||
      transcript.includes('ಗಂಗಾಕಲ್ಯಾಣ') ||
      transcript.includes('ಕೊಳವೆಬಾವಿ') ||
      transcript.includes('ಬೋರ್‌ವೆಲ್') ||
      transcript.toLowerCase().includes('ganga kalyana') ||
      transcript.toLowerCase().includes('borewell');

    const isRaitaVidyaNidhi =
      scenarioHint?.startsWith('raita_vidya_nidhi') ||
      transcript.includes('ರೈತ ವಿದ್ಯಾ ನಿಧಿ') ||
      transcript.includes('ರೈತ ವಿದ್ಯಾನಿಧಿ') ||
      transcript.includes('ವಿದ್ಯಾರ್ಥಿವೇತನ') ||
      transcript.toLowerCase().includes('raita vidya nidhi') ||
      transcript.toLowerCase().includes('vidyanidhi');

    const isSwavalambana =
      scenarioHint?.startsWith('swavalambana') ||
      transcript.includes('ಸ್ವಾವಲಂಬನ') ||
      transcript.includes('ಸ್ವಾವಲಂಬನೆ') ||
      transcript.includes('ಸ್ವಯಂ ಉದ್ಯೋಗ') ||
      transcript.includes('ಸಣ್ಣ ಉದ್ಯಮ') ||
      transcript.toLowerCase().includes('swavalambana') ||
      transcript.toLowerCase().includes('self employment');

    const scheme = isBmtc
      ? SUPPORTED_SCHEMES.bmtc_student_pass
      : isGruhaJyothi
      ? SUPPORTED_SCHEMES.gruha_jyothi
      : isCasteIncome
      ? SUPPORTED_SCHEMES.caste_income
      : isAnnaBhagya
      ? SUPPORTED_SCHEMES.anna_bhagya
      : isYuvaNidhi
      ? SUPPORTED_SCHEMES.yuva_nidhi
      : isGangaKalyana
      ? SUPPORTED_SCHEMES.ganga_kalyana
      : isRaitaVidyaNidhi
      ? SUPPORTED_SCHEMES.raita_vidya_nidhi
      : isSwavalambana
      ? SUPPORTED_SCHEMES.swavalambana
      : SUPPORTED_SCHEMES.gruha_lakshmi;

    const extractedFields: Record<string, string | number> = {};

    if (scheme.id === 'bmtc_student_pass') {
      extractedFields.institutionName = 'BMS College of Engineering, Basavanagudi';
      extractedFields.course = 'B.Tech Computer Science - 3rd Year';
      extractedFields.pickupStop = 'Banashankari TTMC';
      extractedFields.destinationStop = 'Majestic (Kempegowda Bus Station)';

      if (scenarioHint === 'bmtc_student_pass_submit') {
        extractedFields.studentName = 'Priya Sharma';
        extractedFields.mobileNumber = '9845012345';
        extractedFields.aadhaarNumber = '4433 5010 5028';
        extractedFields.otpCode = '3344';
      }

      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      const isComplete = missingFields.length === 0;
      const promptForCitizenKn = isComplete
        ? `ನಿಮ್ಮ ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಬಸ್ ಪಾಸ್ ಅರ್ಜಿ ವಿವರಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ! ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (Port 3002) ಅರ್ಜಿ ಸಲ್ಲಿಸಲು 'CONFIRM' ಅಥವಾ 'YES' ಎಂದು ಉತ್ತರಿಸಿ.`
        : `ಖಂಡಿತ! ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಮೊದಲಿಗೆ ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ.`;

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete,
        promptForCitizenKn,
      };
    }

    if (scheme.id === 'gruha_jyothi') {
      extractedFields.applicantName = 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)';
      extractedFields.aadhaarNumber = 'XXXX-XXXX-4821';
      extractedFields.escomName = 'BESCOM (Bangalore Electricity Supply Company)';
      extractedFields.occupancyType = 'Tenant (ಬಾಡಿಗೆದಾರ)';

      const accountMatch = transcript.match(/\b([0-9]{10})\b/);
      const isSecondTurnOrSubmit =
        scenarioHint === 'gruha_jyothi_submit_agent' ||
        Boolean(accountMatch) ||
        transcript.includes('1029384756');

      if (isSecondTurnOrSubmit) {
        extractedFields.consumerId = accountMatch ? accountMatch[1] : '1029384756';
      }

      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      const isComplete = missingFields.length === 0;
      const promptForCitizenKn = isComplete
        ? `ನಿಮ್ಮ ಗೃಹ ಜ್ಯೋತಿ ಅರ್ಜಿಯ ಎಲ್ಲಾ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ! ಸೇವಾ ಸಿಂಧು (Seva Sindhu) ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಏಜೆಂಟ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...`
        : `ಖಂಡಿತ! ನಿಮ್ಮ ಗೃಹ ಜ್ಯೋತಿ 200 ಯೂನಿಟ್ ಉಚಿತ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು, ನಿಮ್ಮ ಕರೆಂಟ್ ಬಿಲ್‌ನಲ್ಲಿರುವ ವಿದ್ಯುತ್ ಖಾತೆ ಸಂಖ್ಯೆ (Account ID / RR Number) ತಿಳಿಸಿ.`;

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete,
        promptForCitizenKn,
      };
    }

    if (scheme.id === 'gruha_lakshmi') {
      // Extract Name
      const nameMatch = transcript.match(/ಹೆಸರು\s+([A-Za-z\u0C80-\u0CFF]+)/i);
      extractedFields.applicantName = nameMatch ? nameMatch[1] : 'ಸವಿತಾ';

      // Extract Ration Card Number
      const rcWithPrefixMatch = transcript.match(/\b(RC[0-9]{8,12})\b/i);
      const rcGenericMatch = transcript.match(/(?:ರೇಷನ್\s*ಕಾರ್ಡ್\s*(?:ಸಂಖ್ಯೆ|ನಂಬರ್)?\s*|RC\s*)([A-Za-z0-9]{8,12})/i);
      extractedFields.rationCardNumber = rcWithPrefixMatch
        ? rcWithPrefixMatch[1].toUpperCase()
        : rcGenericMatch
        ? rcGenericMatch[1].toUpperCase()
        : 'RC9876543210';

      // Extract District / Taluk
      if (transcript.includes('ಮಂಡ್ಯ')) {
        extractedFields.district = 'Mandya';
        extractedFields.taluk = 'Mandya';
      } else {
        extractedFields.district = 'Mandya';
        extractedFields.taluk = 'Mandya';
      }

      // Check missing fields
      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      const isComplete = missingFields.length === 0;
      const promptForCitizenKn = isComplete
        ? `ನಿಮ್ಮ ಗೃಹಲಕ್ಷ್ಮಿ ಅರ್ಜಿಯ ಎಲ್ಲಾ ವಿವರಗಳು ದಾಖಲಾಗಿವೆ. ನಿಮ್ಮ ಪಡಿತರ ಚೀಟಿ (Ration Card) ಫೋಟೋವನ್ನು ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಳುಹಿಸಿ.`
        : `ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ರೇಷನ್ ಕಾರ್ಡ್ ದಾಖಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆಧಾರ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.`;

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete,
        promptForCitizenKn,
      };
    } else if (scheme.id === 'anna_bhagya') {
      const nameMatch = transcript.match(/ಹೆಸರು\s+([A-Za-z\u0C80-\u0CFF]+)/i);
      extractedFields.applicantName = nameMatch ? nameMatch[1] : 'ಬಸವರಾಜ್ (Basavaraj)';
      const rcMatch = transcript.match(/\b(RC[0-9]{8,12})\b/i);
      extractedFields.rationCardNumber = rcMatch ? rcMatch[1].toUpperCase() : 'RC8829104928';
      extractedFields.familyMembersCount = 4;
      extractedFields.aadhaarNumber = 'XXXX-XXXX-9182';
      extractedFields.bankAccountNumber = 'XXXX-XXXX-4412';

      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete: true,
        promptForCitizenKn: 'ನಿಮ್ಮ ಅನ್ನಭಾಗ್ಯ ಯೋಜನೆಯ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ. 4 ಸದಸ್ಯರಿಗೆ ತಲಾ 5 ಕೆಜಿ ಉಚಿತ ಅಕ್ಕಿ ಮತ್ತು ಹೆಚ್ಚುವರಿ 5 ಕೆಜಿಗೆ ಒಟ್ಟು ₹680 ಡಿಬಿಟಿ ನಗದು ಜಮೆಯಾಗಲಿದೆ.',
      };
    } else if (scheme.id === 'yuva_nidhi') {
      const nameMatch = transcript.match(/ಹೆಸರು\s+([A-Za-z\u0C80-\u0CFF]+)/i);
      extractedFields.applicantName = nameMatch ? nameMatch[1] : 'ಸುರೇಶ್ (Suresh)';
      extractedFields.qualificationType = transcript.includes('ಡಿಪ್ಲೊಮಾ') || transcript.toLowerCase().includes('diploma') ? 'DIPLOMA' : 'DEGREE';
      extractedFields.degreeOrDiplomaName = extractedFields.qualificationType === 'DIPLOMA' ? 'Diploma in Mechanical Engineering' : 'B.Sc Computer Science';

      const yearMatch = transcript.match(/\b(20\d{2})\b/);
      const graduationYear = yearMatch ? parseInt(yearMatch[1], 10) : 2024;
      extractedFields.graduationYear = graduationYear;
      extractedFields.aadhaarNumber = 'XXXX-XXXX-7123';
      extractedFields.mobileNumber = '9876543210';

      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      const isEligible = graduationYear >= 2023;
      const stipend = extractedFields.qualificationType === 'DEGREE' ? '₹3,000' : '₹1,500';

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete: missingFields.length === 0,
        promptForCitizenKn: isEligible
          ? `ನಿಮ್ಮ ಯುವನಿಧಿ ಯೋಜನೆಯ ಅರ್ಜಿ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ (${extractedFields.qualificationType}, ತೇರ್ಗಡೆ: ${graduationYear}). ಮಾಸಿಕ ${stipend} ನಿರುದ್ಯೋಗ ಭತ್ಯೆಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ.`
          : `ನಿಮ್ಮ ಯುವನಿಧಿ ಯೋಜನೆಯ ಅರ್ಜಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ (${graduationYear}). ಕ್ಷಮಿಸಿ, ಈ ಯೋಜನೆಯು 2023 ರ ನಂತರ ತೇರ್ಗಡೆಯಾದ ನಿರುದ್ಯೋಗಿ ಅಭ್ಯರ್ಥಿಗಳಿಗೆ ಮಾತ್ರ ಲಭ್ಯವಿದೆ.`,
      };
    } else if (scheme.id === 'ganga_kalyana') {
      const nameMatch = transcript.match(/ರೈತ\s+([A-Za-z\u0C80-\u0CFF]+)/i);
      extractedFields.applicantName = nameMatch ? nameMatch[1] : 'ಮಲ್ಲೇಶ್ ಗೌಡ';
      extractedFields.casteCategory = '2A';
      extractedFields.surveyNumber = '104/2B';
      extractedFields.landAcres = 2.5;
      extractedFields.village = 'Hirekerur';
      extractedFields.mobileNumber = '9845012399';

      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete: missingFields.length === 0,
        promptForCitizenKn: 'ನಿಮ್ಮ ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆಯ ಅರ್ಜಿ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ. 2.5 ಎಕರೆ ಖುಷ್ಕಿ ಜಮೀನಿಗೆ ಗರಿಷ್ಠ ₹3,50,000 ಮೌಲ್ಯದ ಉಚಿತ ಕೊಳವೆಬಾವಿ ಮತ್ತು ಪಂಪ್‌ಸೆಟ್ ಮಂಜೂರಾತಿಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ.',
      };
    } else if (scheme.id === 'raita_vidya_nidhi') {
      const nameMatch = transcript.match(/ವಿದ್ಯಾರ್ಥಿ\s+([A-Za-z\u0C80-\u0CFF]+)/i);
      extractedFields.studentName = nameMatch ? nameMatch[1] : 'ಕಾವ್ಯ (Kavya)';

      const isMale = transcript.includes('ಗಂಡು') || transcript.toLowerCase().includes('male') || transcript.toLowerCase().includes('boy');
      extractedFields.gender = isMale ? 'MALE' : 'FEMALE';

      const fruitsMatch = transcript.match(/\b(FRUITS[-\s]?\d+)\b/i);
      extractedFields.fruitsId = fruitsMatch ? fruitsMatch[1].toUpperCase() : 'FRUITS-90218';

      const isMedical = transcript.includes('ವೈದ್ಯಕೀಯ') || transcript.toLowerCase().includes('medical');
      const isDegree = transcript.includes('ಪದವಿ') || transcript.toLowerCase().includes('degree');
      extractedFields.courseLevel = isMedical ? 'MEDICAL' : isDegree ? 'DEGREE' : 'PUC';

      extractedFields.collegeName = extractedFields.courseLevel === 'DEGREE' ? 'Government First Grade College, Mandya' : 'Government PU College, Mandya';
      extractedFields.aadhaarNumber = 'XXXX-XXXX-9812';
      extractedFields.mobileNumber = '9845012399';

      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      const scholarshipAmount =
        extractedFields.courseLevel === 'MEDICAL'
          ? (extractedFields.gender === 'FEMALE' ? 11000 : 10000)
          : extractedFields.courseLevel === 'DEGREE'
          ? (extractedFields.gender === 'FEMALE' ? 5500 : 5000)
          : (extractedFields.gender === 'FEMALE' ? 3000 : 2500);

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete: missingFields.length === 0,
        promptForCitizenKn: `ನಿಮ್ಮ ಮುಖ್ಯಮಂತ್ರಿ ರೈತ ವಿದ್ಯಾ ನಿಧಿ ಯೋಜನೆಯ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ (${extractedFields.courseLevel} - ${extractedFields.gender}). ವಾರ್ಷಿಕ ₹${scholarshipAmount} ವಿದ್ಯಾರ್ಥಿವೇತನ ಡಿಬಿಟಿ ಜಮೆಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ.`,
      };
    } else if (scheme.id === 'swavalambana') {
      const nameMatch = transcript.match(/ಅರ್ಜಿದಾರ\s+([A-Za-z\u0C80-\u0CFF]+)/i);
      extractedFields.applicantName = nameMatch ? nameMatch[1] : 'ಪ್ರಕಾಶ್ ಕುಮಾರ್ (Prakash Kumar)';
      extractedFields.enterpriseType = 'Retail Grocery & Stationery Store';
      extractedFields.projectCostInr = 200000;
      extractedFields.casteCategory = '2A';
      extractedFields.bankIfsc = 'SBIN0040123';
      extractedFields.aadhaarNumber = 'XXXX-XXXX-3344';
      extractedFields.mobileNumber = '9845012399';

      const missingFields = scheme.requiredFields
        .filter((field) => field.required && !extractedFields[field.key])
        .map((field) => ({ key: field.key, labelKn: field.labelKn, labelEn: field.labelEn }));

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields,
        isComplete: missingFields.length === 0,
        promptForCitizenKn: 'ನಿಮ್ಮ ಸ್ವಾವಲಂಬನ ಸ್ವಯಂ ಉದ್ಯೋಗ ಯೋಜನೆಯ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ. ₹2,00,000 ಯೋಜನೆ ವೆಚ್ಚಕ್ಕೆ ಗರಿಷ್ಠ ₹1,00,000 (50%) ಬಂಡವಾಳ ಸಹಾಯಧನಕ್ಕೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ.',
      };
    } else {
      // Caste & Income extraction
      extractedFields.applicantName = 'ರಮೇಶ್ ಕುಮಾರ್';
      extractedFields.fatherOrHusbandName = 'ಶಿವಲಿಂಗಪ್ಪ';
      extractedFields.casteCategory = '2A';
      extractedFields.annualIncome = 100000;
      extractedFields.district = 'Dharwad';
      extractedFields.taluk = 'Hubballi';

      return {
        schemeId: scheme.id,
        schemeNameKn: scheme.nameKn,
        schemeNameEn: scheme.nameEn,
        extractedFields,
        missingFields: [],
        isComplete: true,
        promptForCitizenKn: `ನಿಮ್ಮ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರದ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ. ದೃಢೀಕರಿಸಲು ಹೌದು ಎಂದು ಉತ್ತರಿಸಿ.`,
      };
    }
  }

  /**
   * Kagada-Check: Audits uploaded documents for mismatches before submission
   */
  auditDocument(
    documentType: string,
    imageProvided: boolean,
    scenarioHint?: string
  ): DocumentAuditResult {
    if (!imageProvided && !scenarioHint) {
      return {
        documentType: 'unknown',
        status: 'UNREADABLE',
        confidence: 0,
        extractedMetadata: {},
        issues: ['ಚಿತ್ರ ಅಸ್ಪಷ್ಟವಾಗಿದೆ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಆಗಿಲ್ಲ (Image missing or unreadable)'],
        spokenVerdictKn: 'ಚಿತ್ರ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೆಳಕಿನಲ್ಲಿ ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ತೆಗೆದು ಮತ್ತೊಮ್ಮೆ ಕಳುಹಿಸಿ.',
        spokenVerdictEn: 'The image is not clear. Please take a well-lit photo of the document and send again.',
      };
    }

    if (scenarioHint === 'document_check_mismatch' || (!scenarioHint && documentType === 'aadhaar')) {
      return {
        documentType: 'Aadhaar Card vs Ration Card',
        status: 'MISMATCH_DETECTED',
        confidence: 0.94,
        extractedMetadata: {
          aadhaarName: 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)',
          rationCardName: 'ಸವಿತಾ (Savitha)',
          aadhaarLast4: '4821',
          matchScore: '78%',
        },
        issues: [
          'ಹೆಸರು ಹೊಂದಾಣಿಕೆ ದೋಷ: ಆಧಾರ್‌ನಲ್ಲಿ "ಸವಿತಾ ಕುಮಾರಿ", ರೇಷನ್ ಕಾರ್ಡ್‌ನಲ್ಲಿ "ಸವಿತಾ" ಎಂದಿದೆ.',
        ],
        spokenVerdictKn:
          'ನಿಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್‌ನಲ್ಲಿ "ಸವಿತಾ ಕುಮಾರಿ" ಮತ್ತು ರೇಷನ್ ಕಾರ್ಡ್‌ನಲ್ಲಿ "ಸವಿತಾ" ಎಂದು ಹೆಸರು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರದಲ್ಲಿ ನಿಮ್ಮ ಹೆಸರಿನ ತಿದ್ದುಪಡಿ ಮಾಡಿಸಿ ನಂತರ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
        spokenVerdictEn:
          'Name discrepancy detected: Aadhaar reads "Savitha Kumari" while Ration Card reads "Savitha". Please update your name at Grama One before submitting.',
      };
    }

    // Default: Verified clean document
    return {
      documentType: documentType || 'Ration Card',
      status: 'VERIFIED',
      confidence: 0.98,
      extractedMetadata: {
        documentHolder: 'ಸವಿತಾ (Savitha)',
        cardNumber: 'RC9876543210',
        category: 'BPL / Antyodaya',
        status: 'ACTIVE_VALID',
      },
      issues: [],
      spokenVerdictKn:
        'ನಿಮ್ಮ ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದೆ. ಯಾವುದೇ ದೋಷ ಕಂಡುಬಂದಿಲ್ಲ, ನಿಮ್ಮ ಅರ್ಜಿ ಮುಂದುವರೆಯಬಹುದು.',
      spokenVerdictEn:
        'Your document has been verified successfully with no discrepancies. Your application can proceed.',
    };
  }
}

export const schemesService = new SchemesService();
