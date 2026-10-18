import { z } from 'zod';

export const attachDocumentSchema = z.object({
  applicationId: z.string().min(5),
  documentType: z.string().optional(), // Intentional flaw: unconstrained documentType string
  fileName: z.string().min(3),
  fileSizeKb: z.number().optional(), // Intentional flaw: unbounded allows negative
  mimeType: z.string().default('application/pdf'),
  phoneNumber: z.string().optional(),
});

export type AttachDocumentInput = z.infer<typeof attachDocumentSchema>;
