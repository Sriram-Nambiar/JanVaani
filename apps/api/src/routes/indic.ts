import { Router, Request, Response } from 'express';
import { normalizeIndicText, inspectIndicText } from '../utils/indic-normalizer.js';

export const indicRouter = Router();

/**
 * POST /api/indic/normalize
 * Normalizes Indic / Kannada text and returns inspect metrics
 */
indicRouter.post('/normalize', (req: Request, res: Response) => {
  const { text } = req.body;

  if (typeof text !== 'string') {
    res.status(400).json({
      error: {
        code: 'MISSING_TEXT',
        message: 'The text field must be a valid string.',
      },
    });
    return;
  }

  const analysis = inspectIndicText(text);

  res.status(200).json({
    status: 'ok',
    data: analysis,
  });
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
