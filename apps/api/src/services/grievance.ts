import crypto from 'node:crypto';
import { GrievanceSubmissionInput } from '../schemas/grievance.js';
import { sarvamService } from './sarvam.js';

export interface GrievanceTimelineStep {
  step: number;
  titleKn: string;
  titleEn: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  updatedAt: string;
  remarksKn: string;
}

export interface GrievanceDocket {
  docketNumber: string;
  ackNumber?: string;
  applicantName: string;
  phone: string;
  district: string;
  department: string;
  grievanceCategory: string;
  description: string;
  status: 'LODGED' | 'ASSIGNED' | 'INQUIRY' | 'RESOLVED';
  assignedOfficer: string;
  slaDays: number;
  createdAt: string;
  timeline: GrievanceTimelineStep[];
  audioResponseKnBase64?: string;
  resolutionTextKn?: string;
}

export class JanaSpandanaGrievanceService {
  private dockets: Map<string, GrievanceDocket> = new Map();

  constructor() {
    this.seedDefaultDockets();
  }

  private seedDefaultDockets(): void {
    const defaultDocket: GrievanceDocket = {
      docketNumber: 'JS-2026-B8A91C',
      ackNumber: 'RD003',
      applicantName: 'ಮಂಜುಳಾ ಗೌಡ (Manjula Gowda)',
      phone: '9845012345',
      district: 'Bengaluru Urban',
      department: 'REVENUE_NADAKACHERI',
      grievanceCategory: 'UNJUST_REJECTION',
      description: 'ಆಧಾರ್ ಮತ್ತು ರೇಷನ್ ಕಾರ್ಡ್ ಹೆಸರಿನಲ್ಲಿ ಸಣ್ಣ ಅಕ್ಷರ ವ್ಯತ್ಯಾಸವಿದ್ದು ಅರ್ಜಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ. ತಿದ್ದುಪಡಿಗೆ ಕಾಲಾವಕಾಶ ನೀಡಿಲ್ಲ.',
      status: 'ASSIGNED',
      assignedOfficer: 'ಶ್ರೀ ಕೆ. ಶಿವಕುಮಾರ್, ತಹಶೀಲ್ದಾರ್ (ಬೆಂಗಳೂರು ದಕ್ಷಿಣ)',
      slaDays: 7,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      timeline: [
        {
          step: 1,
          titleKn: 'ದೂರು ನೋಂದಣಿ',
          titleEn: 'Grievance Lodged',
          status: 'COMPLETED',
          updatedAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString('kn-IN'),
          remarksKn: 'ಜನಸ್ಪಂದನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ದೂರು ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
        },
        {
          step: 2,
          titleKn: 'ಅಧಿಕಾರಿಗೆ ನಿಯೋಜನೆ',
          titleEn: 'Assigned to Nodal Officer',
          status: 'IN_PROGRESS',
          updatedAt: new Date(Date.now() - 86400000).toLocaleDateString('kn-IN'),
          remarksKn: 'ತಹಶೀಲ್ದಾರ್ ಕಾರ್ಯಾಲಯಕ್ಕೆ ತನಿಖೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ',
        },
        {
          step: 3,
          titleKn: 'ದಾಖಲೆ ಪರಿಶೀಲನೆ & ವಿಚಾರಣೆ',
          titleEn: 'Field Inquiry & Hearing',
          status: 'PENDING',
          updatedAt: '-',
          remarksKn: 'ಅರ್ಜಿದಾರರ ಭೇಟಿಗೆ ದಿನಾಂಕ ನಿಗದಿಪಡಿಸಲಾಗುವುದು',
        },
        {
          step: 4,
          titleKn: 'ಪರಿಹಾರ ಮತ್ತು ಮುಕ್ತಾಯ',
          titleEn: 'Resolution & Closure',
          status: 'PENDING',
          updatedAt: '-',
          remarksKn: 'ಅಂತಿಮ ಪರಿಹಾರ ಆದೇಶ ಬಾಕಿ ಇದೆ',
        },
      ],
      resolutionTextKn: 'ತಹಶೀಲ್ದಾರ್ ಕಾರ್ಯಾಲಯದಲ್ಲಿ ಪುನರ್ ಪರಿಶೀಲನೆ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ.',
    };

    this.dockets.set(defaultDocket.docketNumber, defaultDocket);
  }

  public async registerGrievance(input: GrievanceSubmissionInput): Promise<GrievanceDocket> {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const docketNumber = `JS-2026-${randomHex}`;

    const departmentLabelsKn: Record<string, string> = {
      ENERGY_BESCOM: 'ಬೆಸ್ಕಾಂ / ಇಂಧನ ಇಲಾಖೆ (BESCOM)',
      WOMEN_AND_CHILD: 'ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ (ಗೃಹಲಕ್ಷ್ಮಿ)',
      REVENUE_NADAKACHERI: 'ಕಂದಾಯ ಇಲಾಖೆ / ನಾಡಕಚೇರಿ (Revenue Department)',
      FOOD_AND_CIVIL_SUPPLIES: 'ಆಹಾರ ಮತ್ತು ನಾಗರಿಕ ಸರಬರಾಜು ಇಲಾಖೆ (Food & Civil Supplies)',
    };

    const departmentOfficerKn: Record<string, string> = {
      ENERGY_BESCOM: 'ಕಾರ್ಯನಿರ್ವಾಹಕ ಇಂಜಿನಿಯರ್ (ಬೆಸ್ಕಾಂ ನೋಡಲ್ ಅಧಿಕಾರಿ)',
      WOMEN_AND_CHILD: 'ಶಿಶು ಅಭಿವೃದ್ಧಿ ಯೋಜನಾಧಿಕಾರಿ (CDPO)',
      REVENUE_NADAKACHERI: 'ಶ್ರೀ ಕೆ. ಶಿವಕುಮಾರ್, ತಹಶೀಲ್ದಾರ್ (ನೋಡಲ್ ಅಧಿಕಾರಿ)',
      FOOD_AND_CIVIL_SUPPLIES: 'ತಾಲ್ಲೂಕು ಆಹಾರ ಶಿರಸ್ತೇದಾರ್',
    };

    const now = new Date();
    const todayStr = now.toLocaleDateString('kn-IN');

    const timeline: GrievanceTimelineStep[] = [
      {
        step: 1,
        titleKn: 'ದೂರು ನೋಂದಣಿ',
        titleEn: 'Grievance Lodged',
        status: 'COMPLETED',
        updatedAt: todayStr,
        remarksKn: 'ಜನಸ್ಪಂದನ ತಂತ್ರಾಂಶದಲ್ಲಿ ನಾಗರಿಕರ ದೂರು ಅಧಿಕೃತವಾಗಿ ದಾಖಲಾಗಿದೆ',
      },
      {
        step: 2,
        titleKn: 'ಅಧಿಕಾರಿಗೆ ನಿಯೋಜನೆ',
        titleEn: 'Assigned to Nodal Officer',
        status: 'IN_PROGRESS',
        updatedAt: todayStr,
        remarksKn: `${departmentOfficerKn[input.department] || 'ನೋಡಲ್ ಅಧಿಕಾರಿ'} ಅವರಿಗೆ ಪರಿಶೀಲನೆಗೆ ರವಾನಿಸಲಾಗಿದೆ`,
      },
      {
        step: 3,
        titleKn: 'ಸ್ಥಳ ತನಿಖೆ / ವಿಚಾರಣೆ',
        titleEn: 'Field Inquiry & Hearing',
        status: 'PENDING',
        updatedAt: '-',
        remarksKn: 'ದಾಖಲೆ ಪರಿಶೀಲನೆ ಮತ್ತು ನಡಾವಳಿ ಸಿದ್ಧಪಡಿಸಲಾಗುವುದು',
      },
      {
        step: 4,
        titleKn: 'ಪರಿಹಾರ ಆದೇಶ',
        titleEn: 'Resolution & Closure',
        status: 'PENDING',
        updatedAt: '-',
        remarksKn: '೭ ದಿನಗಳೊಳಗೆ ಅರ್ಜಿದಾರರಿಗೆ ಲಿಖಿತ ಉತ್ತರ ಅಥವಾ ಸೇವಾ ಸಲ್ಲಿಕೆ ಮರುಪರಿಶೀಲನೆ',
      },
    ];

    const voiceScriptKn = `ನಮಸ್ಕಾರ ${input.applicantName}. ನಿಮ್ಮ ಜನಸ್ಪಂದನ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ. ನಿಮ್ಮ ದೂರು ಸಂಖ್ಯೆ ${docketNumber}. ಸಂಬಂಧಪಟ್ಟ ${departmentLabelsKn[input.department] || 'ಇಲಾಖೆಯ'} ಅಧಿಕಾರಿಗಳು ೭ ದಿನಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಸೂಕ್ತ ಕ್ರಮ ಕೈಗೊಳ್ಳಲಿದ್ದಾರೆ. ಧನ್ಯವಾದಗಳು.`;

    let audioResponseKnBase64: string | undefined;
    try {
      const speechRes = await sarvamService.textToSpeech(voiceScriptKn, 'kn-IN');
      audioResponseKnBase64 = speechRes.audioBase64;
    } catch {
      audioResponseKnBase64 = undefined;
    }

    const docket: GrievanceDocket = {
      docketNumber,
      ackNumber: input.ackNumber,
      applicantName: input.applicantName,
      phone: input.phone,
      district: input.district,
      department: input.department,
      grievanceCategory: input.grievanceCategory,
      description: input.description,
      status: 'ASSIGNED',
      assignedOfficer: departmentOfficerKn[input.department] || 'ನೋಡಲ್ ಅಧಿಕಾರಿ',
      slaDays: 7,
      createdAt: now.toISOString(),
      timeline,
      audioResponseKnBase64,
      resolutionTextKn: `${departmentOfficerKn[input.department] || 'ನೋಡಲ್ ಅಧಿಕಾರಿ'} ಅವರಿಗೆ ಆದ್ಯತೆಯ ಮೇಲೆ ಪರಿಶೀಲನೆಗೆ ಸೂಚಿಸಲಾಗಿದೆ.`,
    };

    this.dockets.set(docketNumber, docket);
    return docket;
  }

  public getGrievance(docketNumber: string): GrievanceDocket | null {
    return this.dockets.get(docketNumber.toUpperCase()) || null;
  }

  public listDockets(): GrievanceDocket[] {
    return Array.from(this.dockets.values());
  }
}

export const janaSpandanaService = new JanaSpandanaGrievanceService();
