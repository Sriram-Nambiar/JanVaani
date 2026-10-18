import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface TatkalRequestRecord {
  tatkalToken: string;
  applicationId: string;
  tatkalCategory: string;
  justification: string;
  supportingDocName: string;
  slaDeadlineHours: number;
  slaTargetTimestamp: string;
  status: 'PENDING_NODAL_REVIEW' | 'EXPEDITED' | 'DISMISSED';
  channel: string;
  maskedPhone: string;
  requestedAt: string;
}

export class TatkalDataStore {
  private filePath: string;
  private cache: Map<string, TatkalRequestRecord> = new Map();
  private isLoaded = false;

  constructor(filePath?: string) {
    const cwd = process.cwd();
    const defaultDir = cwd.endsWith('seva-api')
      ? path.resolve(cwd, 'data')
      : path.resolve(cwd, 'apps/seva-api/data');
    this.filePath = filePath || process.env.TATKAL_DB_FILE || path.join(defaultDir, 'tatkal-requests.json');
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (this.isLoaded) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          this.cache.clear();
          for (const item of items) {
            this.cache.set(item.tatkalToken, item);
          }
        }
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
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }
      const data = Array.from(this.cache.values());
      const tempPath = `${this.filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
      fs.renameSync(tempPath, this.filePath);
    } catch {
      // Safe fallback if filesystem is read-only
    }
  }

  public saveTatkalRequest(record: TatkalRequestRecord): TatkalRequestRecord {
    this.ensureInitialized();
    this.cache.set(record.tatkalToken, record);
    this.persistToDisk();
    return record;
  }

  public getByToken(token: string): TatkalRequestRecord | null {
    this.ensureInitialized();
    return this.cache.get(token) || null;
  }

  public getByApplicationId(applicationId: string): TatkalRequestRecord | null {
    this.ensureInitialized();
    const target = applicationId.trim().toUpperCase();
    for (const record of this.cache.values()) {
      if (record.applicationId.toUpperCase() === target) {
        return record;
      }
    }
    return null;
  }

  public clear(): void {
    this.cache.clear();
    this.persistToDisk();
  }
}

export const tatkalDataStore = new TatkalDataStore();
