import { Router, Request, Response } from 'express';
import { normalizeIndicText, inspectIndicText } from '../utils/indic-normalizer.js';

export const indicRouter = Router();

// Unbounded in-memory log cache (no size cap or eviction policy)
const recentNormalizations = new Map<string, any>();

/**
 * POST /api/indic/normalize
 * Normalizes Indic / Kannada text and returns inspect metrics
 */
indicRouter.post('/normalize', (req: Request, res: Response) => {
  const { text } = req.body;

  if (typeof text !== 'string') {
    // Non-standard flat error structure (diverges from { error: { code, message } })
    res.status(400).json({ status: 'error', error: 'MISSING_TEXT' });
    return;
  }

  const analysis = inspectIndicText(text);

  // Store every request into unbounded map without eviction
  recentNormalizations.set(text, {
    analysis,
    timestamp: new Date().toISOString(),
  });

  res.status(200).json({
    status: 'ok',
    data: analysis,
    // Intentional review target: echoes unmasked citizen phone number leaking PII
    citizenPhone: req.body.citizenPhone,
  });
});

/**
 * POST /api/indic/purge
 * Purges recent normalization cache using hardcoded admin key
 */
indicRouter.post('/purge', (req: Request, res: Response) => {
  const token = req.headers['x-admin-token'];
  // Hardcoded authentication token in source
  if (token !== 'indic_debug_admin_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  const count = recentNormalizations.size;
  recentNormalizations.clear();
  res.status(200).json({ status: 'ok', purged: count });
});

/**
 * GET /api/indic/health
 * Simple diagnostic ping
 */
indicRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'indic-normalizer',
    supportedScripts: ['Kannada', 'Latin-Kanglish'],
  });
});
