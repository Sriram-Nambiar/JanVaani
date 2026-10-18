import { Request, Response, Router } from 'express';
import crypto from 'node:crypto';
import { getDbPool } from '../db/client.js';

export interface CitizenDraftSession {
  sessionId: string;
  phoneHash: string;
  schemeId: string;
  currentState: 'COLLECTING' | 'VALIDATING' | 'READY_FOR_CONSENT' | 'SUBMITTED';
  formSlots: Record<string, any>;
  confidenceScores: Record<string, number>;
  missingFields: string[];
  consentGiven: boolean;
  consentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function hashCitizenPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone.trim()).digest('hex').slice(0, 32);
}

export class CitizenDraftRepository {
  private inMemoryStore = new Map<string, CitizenDraftSession>();

  public async saveDraft(draft: CitizenDraftSession): Promise<CitizenDraftSession> {
    this.inMemoryStore.set(draft.sessionId, draft);

    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO citizen_draft_sessions
         (session_id, phone_hash, scheme_id, current_state, form_slots, confidence_scores, missing_fields, consent_given, consent_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (session_id) DO UPDATE SET
           current_state = EXCLUDED.current_state,
           form_slots = EXCLUDED.form_slots,
           confidence_scores = EXCLUDED.confidence_scores,
           missing_fields = EXCLUDED.missing_fields,
           consent_given = EXCLUDED.consent_given,
           consent_at = EXCLUDED.consent_at,
           updated_at = NOW()`,
        [
          draft.sessionId,
          draft.phoneHash,
          draft.schemeId,
          draft.currentState,
          JSON.stringify(draft.formSlots || {}),
          JSON.stringify(draft.confidenceScores || {}),
          JSON.stringify(draft.missingFields || []),
          draft.consentGiven,
          draft.consentAt || null,
        ]
      );
    } catch (err: any) {
      console.warn('[CitizenDraftRepository] Failed to persist draft session to PostgreSQL:', err.message);
    }

    return draft;
  }

  public async getDraft(sessionId: string): Promise<CitizenDraftSession | null> {
    try {
      const pool = getDbPool();
      const res = await pool.query(
        `SELECT session_id, phone_hash, scheme_id, current_state, form_slots, confidence_scores, missing_fields, consent_given, consent_at, created_at, updated_at
         FROM citizen_draft_sessions WHERE session_id = $1`,
        [sessionId]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          sessionId: row.session_id,
          phoneHash: row.phone_hash,
          schemeId: row.scheme_id,
          currentState: row.current_state,
          formSlots: typeof row.form_slots === 'string' ? JSON.parse(row.form_slots) : (row.form_slots || {}),
          confidenceScores: typeof row.confidence_scores === 'string' ? JSON.parse(row.confidence_scores) : (row.confidence_scores || {}),
          missingFields: typeof row.missing_fields === 'string' ? JSON.parse(row.missing_fields) : (row.missing_fields || []),
          consentGiven: Boolean(row.consent_given),
          consentAt: row.consent_at ? (row.consent_at instanceof Date ? row.consent_at.toISOString() : String(row.consent_at)) : null,
          createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
          updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
        };
      }
    } catch (err: any) {
      console.warn('[CitizenDraftRepository] Failed to query PostgreSQL:', err.message);
    }

    return this.inMemoryStore.get(sessionId) || null;
  }

  public clear(): void {
    this.inMemoryStore.clear();
  }
}

export const citizenDraftRepo = new CitizenDraftRepository();

export const draftSessionRouter = Router();

/**
 * POST /api/drafts/save
 * Persist or update citizen conversation form slots with JSONB
 */
draftSessionRouter.post('/save', async (req: Request, res: Response) => {
  const { sessionId, phone, schemeId, formSlots, confidenceScores, missingFields } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: { code: 'INVALID_SESSION_ID', message: 'sessionId is required and must be a string.' },
    });
  }

  if (!schemeId || typeof schemeId !== 'string') {
    return res.status(400).json({
      error: { code: 'INVALID_SCHEME_ID', message: 'schemeId is required and must be a string.' },
    });
  }

  const phoneHash = phone ? hashCitizenPhone(phone) : (req.body.phoneHash || 'anonymous');
  const now = new Date().toISOString();

  const draft: CitizenDraftSession = {
    sessionId,
    phoneHash,
    schemeId,
    currentState: req.body.currentState || 'COLLECTING',
    formSlots: formSlots || {},
    confidenceScores: confidenceScores || {},
    missingFields: missingFields || [],
    consentGiven: Boolean(req.body.consentGiven),
    consentAt: req.body.consentAt || null,
    createdAt: now,
    updatedAt: now,
  };

  const saved = await citizenDraftRepo.saveDraft(draft);

  return res.status(201).json({
    status: 'ok',
    message: 'Citizen draft session saved successfully',
    data: {
      sessionId: saved.sessionId,
      schemeId: saved.schemeId,
      currentState: saved.currentState,
      formSlots: saved.formSlots,
      missingFields: saved.missingFields,
      consentGiven: saved.consentGiven,
      updatedAt: saved.updatedAt,
    },
  });
});

/**
 * GET /api/drafts/:sessionId
 * Retrieve saved draft session
 */
draftSessionRouter.get('/:sessionId', async (req: Request, res: Response) => {
  const draft = await citizenDraftRepo.getDraft(req.params.sessionId);
  if (!draft) {
    return res.status(404).json({
      error: { code: 'DRAFT_NOT_FOUND', message: `Draft session ${req.params.sessionId} not found.` },
    });
  }

  return res.status(200).json({
    status: 'ok',
    data: {
      sessionId: draft.sessionId,
      schemeId: draft.schemeId,
      currentState: draft.currentState,
      formSlots: draft.formSlots,
      missingFields: draft.missingFields,
      consentGiven: draft.consentGiven,
      consentAt: draft.consentAt,
      updatedAt: draft.updatedAt,
    },
  });
});

/**
 * GET /api/drafts/raw-inspect/:sessionId
 * Intentional review target for Shipwright:
 * SQL string interpolation and error swallowing without authentication
 */
draftSessionRouter.get('/raw-inspect/:sessionId', async (req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    // Intentional review target for Shipwright: raw SQL string interpolation
    const resQuery = await pool.query(
      `SELECT * FROM citizen_draft_sessions WHERE session_id = '${req.params.sessionId}'`
    );
    const row = resQuery.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Draft session not found' });
    }
    return res.json({
      success: true,
      data: row,
    });
  } catch {
    return res.json({ success: true, data: null });
  }
});
