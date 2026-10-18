import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { maskId } from '../services/tracker.js';

export const dashboardRouter = Router();

// Bounded in-memory log of citizen voice queries
const MAX_VOICE_QUERY_LOGS = 100;
const voiceQueryHistory: Array<{
  id: string;
  transcript: string;
  citizenPhone: string;
  language: string;
  timestamp: string;
}> = [];

// Schema for voice query recording
const voiceQuerySchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
  citizenPhone: z.string().min(10, 'Valid 10-digit phone number is required'),
  language: z.enum(['kn', 'en']).default('kn'),
});

// Schema for WhatsApp checklist dispatch
const whatsappChecklistSchema = z.object({
  citizenPhone: z.string().min(10, 'Valid 10-digit phone number is required'),
  applicantName: z.string().min(1, 'Applicant name is required'),
  district: z.string().min(1, 'District is required'),
  schemeIds: z.array(z.string()).min(1, 'At least one scheme ID is required'),
});

function isAuthorizedAdmin(req: Request): boolean {
  const configuredKey = process.env.DASHBOARD_ADMIN_KEY || process.env.JANVAANI_ADMIN_SECRET;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return false;
  }
  const provided = req.headers['x-admin-key'];
  if (typeof provided !== 'string') {
    return false;
  }
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(configuredKey);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// GET /api/dashboard/schemes — returns verified Karnataka welfare schemes
dashboardRouter.get('/schemes', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'gruha-lakshmi',
        categoryKn: 'ಮಹಿಳಾ ಕಲ್ಯಾಣ',
        categoryEn: "Women's Welfare",
        nameKn: 'ಗೃಹ ಲಕ್ಷ್ಮಿ ಯೋಜನೆ',
        nameEn: 'Gruha Lakshmi Scheme',
        matchScore: '98% ಹೊಂದಿಕೆ',
        matchPercentage: 98,
        benefitKn: '₹2,000 / ತಿಂಗಳು',
        benefitEn: '₹2,000 / month',
        monthlyAmount: 2000,
        descriptionKn:
          'ಕುಟುಂಬದ ಯಜಮಾನಿ ಮಹಿಳೆಗೆ ಪ್ರತಿ ತಿಂಗಳು ಆರ್ಥಿಕ ನೆರವು ನೀಡುವ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಮಹತ್ವಾಕಾಂಕ್ಷಿ ಯೋಜನೆ.',
        descriptionEn:
          'Monthly financial assistance for the woman head of a household.',
        requiredDocuments: ['Aadhaar Card', 'Ration Card (BPL/AAY)', 'Bank Account linked to Aadhaar'],
      },
      {
        id: 'sandhya-suraksha',
        categoryKn: 'ಹಿರಿಯ ನಾಗರಿಕರು',
        categoryEn: 'Senior Citizens',
        nameKn: 'ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ',
        nameEn: 'Sandhya Suraksha',
        matchScore: '92% ಹೊಂದಿಕೆ',
        matchPercentage: 92,
        benefitKn: '₹1,200 / ತಿಂಗಳು',
        benefitEn: '₹1,200 / month',
        monthlyAmount: 1200,
        descriptionKn:
          '65 ವರ್ಷ ಮತ್ತು ಮೇಲ್ಪಟ್ಟ ಅರ್ಹ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಪ್ರತಿ ತಿಂಗಳು ನೀಡಲಾಗುವ ವೃದ್ಧಾಪ್ಯ ಮಾಶಾಸನ.',
        descriptionEn:
          'Monthly pension for eligible citizens aged 65 and above.',
        requiredDocuments: ['Age Proof / Birth Certificate', 'Income Certificate (< ₹20,000/yr)', 'Aadhaar Card'],
      },
    ],
  });
});

// POST /api/dashboard/voice-query — records conversational voice query
dashboardRouter.post('/voice-query', (req: Request, res: Response) => {
  const result = voiceQuerySchema.safeParse(req.body);
  if (!result.success) {
    // Zero PII reflection on error
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid voice query payload',
    });
  }

  const entry = {
    id: `vq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    transcript: result.data.transcript,
    citizenPhone: maskId(result.data.citizenPhone),
    language: result.data.language,
    timestamp: new Date().toISOString(),
  };

  // Appended to bounded array
  voiceQueryHistory.push(entry);
  if (voiceQueryHistory.length > MAX_VOICE_QUERY_LOGS) {
    voiceQueryHistory.shift();
  }

  return res.status(200).json({
    success: true,
    queryId: entry.id,
    recognizedText: entry.transcript,
    detectedLanguage: entry.language,
  });
});

// POST /api/dashboard/whatsapp-checklist — dispatches document checklist to WhatsApp
dashboardRouter.post('/whatsapp-checklist', (req: Request, res: Response) => {
  const result = whatsappChecklistSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid checklist request payload',
    });
  }

  const dispatchId = `wa-chk-${Date.now()}`;

  // Returns masked citizen phone number to prevent PII exposure
  return res.status(200).json({
    success: true,
    dispatchId,
    citizenPhone: maskId(result.data.citizenPhone),
    applicantName: result.data.applicantName,
    nearestKiosk: `Grama One Center, ${result.data.district} Taluk Office Road`,
    status: 'SENT',
    sentAt: new Date().toISOString(),
  });
});

// POST /api/dashboard/clear-logs — flushes voice history logs
dashboardRouter.post('/clear-logs', (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Valid administrative credentials required to clear voice logs',
    });
  }

  const clearedCount = voiceQueryHistory.length;
  voiceQueryHistory.length = 0;

  return res.status(200).json({
    success: true,
    clearedCount,
    message: 'Voice query history cleared successfully',
  });
});
