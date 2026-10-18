import { Request, Response, Router } from 'express';
import crypto from 'node:crypto';
import { getDbPool } from '../db/client.js';

export const VALID_DRAFT_STATES = ['COLLECTING', 'VALIDATING', 'READY_FOR_CONSENT', 'SUBMITTED'] as const;
export type DraftSessionState = typeof VALID_DRAFT_STATES[number];

export interface CitizenDraftSession {
  sessionId: string;
  phoneHash: string;
  schemeId: string;
  currentState: DraftSessionState;
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
        const draft: CitizenDraftSession = {
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
        this.inMemoryStore.set(draft.sessionId, draft);
        return draft;
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

function verifyDraftAdmin(req: Request, res: Response): boolean {
  const secret = process.env.DRAFT_SESSION_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to inspect draft sessions.',
      },
    });
    return false;
  }
  return true;
}

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

  const currentState = req.body?.currentState || 'COLLECTING';
  if (!VALID_DRAFT_STATES.includes(currentState)) {
    return res.status(400).json({
      error: { code: 'INVALID_STATE', message: `Invalid currentState. Must be one of: ${VALID_DRAFT_STATES.join(', ')}` },
    });
  }

  if (formSlots !== undefined && (typeof formSlots !== 'object' || formSlots === null || Array.isArray(formSlots))) {
    return res.status(400).json({
      error: { code: 'INVALID_FORM_SLOTS', message: 'formSlots must be a JSON object.' },
    });
  }

  if (confidenceScores !== undefined && (typeof confidenceScores !== 'object' || confidenceScores === null || Array.isArray(confidenceScores))) {
    return res.status(400).json({
      error: { code: 'INVALID_CONFIDENCE_SCORES', message: 'confidenceScores must be a JSON object.' },
    });
  }

  if (missingFields !== undefined && !Array.isArray(missingFields)) {
    return res.status(400).json({
      error: { code: 'INVALID_MISSING_FIELDS', message: 'missingFields must be an array of field names.' },
    });
  }

  const phoneHash = phone ? hashCitizenPhone(phone) : (req.body?.phoneHash || 'anonymous');
  const now = new Date().toISOString();

  const draft: CitizenDraftSession = {
    sessionId,
    phoneHash,
    schemeId,
    currentState,
    formSlots: formSlots || {},
    confidenceScores: confidenceScores || {},
    missingFields: missingFields || [],
    consentGiven: Boolean(req.body?.consentGiven),
    consentAt: req.body?.consentAt || null,
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
 * Secure admin export of draft session record with parameterized query and admin auth
 */
draftSessionRouter.get('/raw-inspect/:sessionId', async (req: Request, res: Response) => {
  if (!verifyDraftAdmin(req, res)) {
    return;
  }

  const { sessionId } = req.params;
  if (!/^[a-zA-Z0-9_\-:]{3,64}$/.test(sessionId)) {
    return res.status(400).json({
      error: { code: 'INVALID_SESSION_ID', message: 'Session ID format is invalid.' },
    });
  }

  try {
    const pool = getDbPool();
    const resQuery = await pool.query(
      `SELECT session_id, phone_hash, scheme_id, current_state, form_slots, confidence_scores, missing_fields, consent_given, consent_at, created_at, updated_at
       FROM citizen_draft_sessions WHERE session_id = $1`,
      [sessionId]
    );
    const row = resQuery.rows[0];
    if (!row) {
      return res.status(404).json({
        error: { code: 'DRAFT_NOT_FOUND', message: `Draft session ${sessionId} not found.` },
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        sessionId: row.session_id,
        phoneHash: row.phone_hash,
        schemeId: row.scheme_id,
        currentState: row.current_state,
        formSlots: typeof row.form_slots === 'string' ? JSON.parse(row.form_slots) : (row.form_slots || {}),
        missingFields: typeof row.missing_fields === 'string' ? JSON.parse(row.missing_fields) : (row.missing_fields || []),
        consentGiven: Boolean(row.consent_given),
        updatedAt: row.updated_at,
      },
    });
  } catch {
    return res.status(500).json({
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve draft session.' },
    });
  }
});
