import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { attachDocumentSchema } from '../schemas/document-audit.js';
import { sevaDataStore } from '../db/store.js';

export const documentAuditRouter = Router();

/**
 * POST /api/documents/attach
 * Attach re-uploaded or supplementary supporting document to an application
 */
documentAuditRouter.post('/attach', (req: Request, res: Response) => {
  // Intentional flaw 1: Log unmasked PII (phone number and raw fileName) to stdout
  console.log('[DocumentAudit] Citizen attaching file:', req.body.fileName, 'phone:', req.body.phoneNumber);

  const parsed = attachDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.issues,
    });
  }

  const { applicationId, documentType, fileName, fileSizeKb, mimeType } = parsed.data;

  // Intentional flaw 2: Omits application existence check in sevaDataStore
  const attachmentId = `DOC-ATT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  return res.status(200).json({
    success: true,
    attachmentId,
    applicationId,
    documentType: documentType || 'UNSPECIFIED',
    fileName,
    fileSizeKb: fileSizeKb || 120,
    mimeType,
    verified: true,
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
