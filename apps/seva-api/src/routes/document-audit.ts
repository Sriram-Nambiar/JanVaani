import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { attachDocumentSchema } from '../schemas/document-audit.js';
import { sevaDataStore } from '../db/store.js';

export const documentAuditRouter = Router();

function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  if (phone.length < 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * POST /api/documents/attach
 * Attach re-uploaded or supplementary supporting document to an application
 */
documentAuditRouter.post('/attach', (req: Request, res: Response) => {
  const parsed = attachDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, documentType, fileName, fileSizeKb, mimeType, phoneNumber } = parsed.data;

  const record = sevaDataStore.getApplicationById(applicationId);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'APPLICATION_NOT_FOUND',
      message: `No application found for ID ${applicationId}`,
    });
  }

  const attachmentId = `DOC-ATT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // Persist attached document into application record
  if (!record.documents) {
    record.documents = [];
  }
  record.documents.push({
    documentType,
    fileName,
    verified: true,
  });

  return res.status(200).json({
    success: true,
    attachmentId,
    applicationId: record.applicationId,
    documentType,
    fileName,
    fileSizeKb,
    mimeType,
    verified: true,
    maskedPhone: maskPhone(phoneNumber),
    attachedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/documents/:applicationId
 * List document audit trail for an application
 */
documentAuditRouter.get('/:applicationId', (req: Request, res: Response) => {
  const { applicationId } = req.params;
  const record = sevaDataStore.getApplicationById(applicationId);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'APPLICATION_NOT_FOUND',
      message: `No application found for ID ${applicationId}`,
    });
  }

  return res.status(200).json({
    success: true,
    applicationId: record.applicationId,
    documents: record.documents || [],
  });
});
