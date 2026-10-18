import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface SevaApplicationRecord {
  applicationId: string;
  serviceId: string;
  serviceName: string;
  studentName: string;
  maskedAadhaar: string;
  phoneNumber: string;
  institutionName: string;
  courseYear: string;
  pickupStop: string;
  destinationStop: string;
  status: 'RECEIVED' | 'UNDER_VERIFICATION' | 'APPROVED';
  submittedVia: 'SEVA_PORTAL' | 'JANVAANI_AI';
  createdAt: string;
  updatedAt: string;
  isDemoRecord: boolean;
  documents?: Array<{
    documentType: string;
    fileName: string;
    verified: boolean;
  }>;
}

export class SevaDataStore {
  private filePath: string;
  private cache: Map<string, SevaApplicationRecord> = new Map();
  private isLoaded = false;

  constructor(filePath?: string) {
    const defaultDir = path.resolve(process.cwd(), 'apps/seva-api/data');
    this.filePath = filePath || process.env.SEVA_DB_FILE || path.join(defaultDir, 'seva-applications.json');
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (this.isLoaded) return;

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          this.cache.clear();
          for (const item of items) {
            this.cache.set(item.applicationId, item);
          }
        }
      } else {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
      }
      this.isLoaded = true;
    } catch {
      this.isLoaded = true;
    }
  }

  private persistToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.cache.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[SevaDataStore] Disk write error:', err.message);
    }
  }

  public generateApplicationId(): string {
    const timeFragment = Date.now().toString().slice(-6);
    const randomEntropy = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `SEVA-DEMO-${timeFragment}-${randomEntropy}`;
  }

  public maskAadhaar(aadhaar: string): string {
    const digits = aadhaar.replace(/\D/g, '');
    if (digits.length >= 4) {
      const lastFour = digits.slice(-4);
      return `XXXX-XXXX-${lastFour}`;
    }
    return 'XXXX-XXXX-5028';
  }

  public createApplication(input: {
    studentName: string;
    aadhaarNumber: string;
    phoneNumber: string;
    institutionName: string;
    courseYear: string;
    pickupStop: string;
    destinationStop: string;
    submittedVia?: 'SEVA_PORTAL' | 'JANVAANI_AI';
    documents?: Array<{ documentType: string; fileName: string; verified: boolean }>;
  }): SevaApplicationRecord {
    this.ensureInitialized();

    const normalizedName = input.studentName.trim();
    const normalizedInstitution = input.institutionName.trim();
    const normalizedPickup = input.pickupStop.trim();
    const normalizedDestination = input.destinationStop.trim();

    // Check for recent duplicate submission (within 3 minutes)
    const now = Date.now();
    for (const record of this.cache.values()) {
      const recordAgeMs = now - new Date(record.createdAt).getTime();
      if (
        recordAgeMs < 3 * 60 * 1000 &&
        record.studentName.toLowerCase() === normalizedName.toLowerCase() &&
        record.institutionName.toLowerCase() === normalizedInstitution.toLowerCase() &&
        record.pickupStop.toLowerCase() === normalizedPickup.toLowerCase() &&
        record.destinationStop.toLowerCase() === normalizedDestination.toLowerCase()
      ) {
        return record;
      }
    }

    const applicationId = this.generateApplicationId();
    const isoNow = new Date().toISOString();

    const record: SevaApplicationRecord = {
      applicationId,
      serviceId: 'bmtc-student-pass',
      serviceName: 'BMTC Student Bus Pass',
      studentName: normalizedName,
      maskedAadhaar: this.maskAadhaar(input.aadhaarNumber),
      phoneNumber: input.phoneNumber.trim(),
      institutionName: normalizedInstitution,
      courseYear: input.courseYear.trim(),
      pickupStop: normalizedPickup,
      destinationStop: normalizedDestination,
      status: 'RECEIVED',
      submittedVia: input.submittedVia || 'SEVA_PORTAL',
      createdAt: isoNow,
      updatedAt: isoNow,
      isDemoRecord: true,
      documents: input.documents || [
        { documentType: 'student_id', fileName: 'college_id_card.pdf', verified: true },
        { documentType: 'fee_receipt', fileName: 'tuition_fee_receipt.pdf', verified: true },
      ],
    };

    this.cache.set(applicationId, record);
    this.persistToDisk();
    return record;
  }

  public getApplicationById(applicationId: string): SevaApplicationRecord | null {
    this.ensureInitialized();
    const normalizedId = applicationId.trim().toUpperCase();
    return this.cache.get(normalizedId) || null;
  }

  public getAllApplications(): SevaApplicationRecord[] {
    this.ensureInitialized();
    return Array.from(this.cache.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public clear(): void {
    this.cache.clear();
    this.persistToDisk();
  }
}

export const sevaDataStore = new SevaDataStore();
