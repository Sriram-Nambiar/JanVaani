import fs from 'node:fs';
import path from 'node:path';

export interface CitizenFeedbackRecord {
  feedbackId: string;
  applicationId: string;
  rating: number;
  category: string;
  comment: string | null;
  channel: string;
  maskedPhone: string;
  submittedAt: string;
}

export class FeedbackDataStore {
  private filePath: string;
  private cache: Map<string, CitizenFeedbackRecord> = new Map();
  private isLoaded = false;

  constructor(filePath?: string) {
    const cwd = process.cwd();
    const defaultDir = cwd.endsWith('seva-api')
      ? path.resolve(cwd, 'data')
      : path.resolve(cwd, 'apps/seva-api/data');
    this.filePath = filePath || process.env.FEEDBACK_DB_FILE || path.join(defaultDir, 'citizen-feedbacks.json');
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
            this.cache.set(item.feedbackId, item);
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
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.cache.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Safe fallback if filesystem is read-only
    }
  }

  public saveFeedback(feedback: CitizenFeedbackRecord): CitizenFeedbackRecord {
    this.ensureInitialized();
    this.cache.set(feedback.feedbackId, feedback);
    this.persistToDisk();
    return feedback;
  }

  public getFeedbackById(feedbackId: string): CitizenFeedbackRecord | null {
    this.ensureInitialized();
    return this.cache.get(feedbackId) || null;
  }

  public getFeedbackByApplicationId(applicationId: string): CitizenFeedbackRecord | null {
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

export const feedbackDataStore = new FeedbackDataStore();
