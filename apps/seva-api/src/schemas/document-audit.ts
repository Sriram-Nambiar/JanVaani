import { z } from 'zod';

export const documentTypeEnum = z.enum([
  'student_id',
  'fee_receipt',
  'caste_certificate',
  'income_certificate',
  'bonafide_certificate',
  'photo',
]);

export const attachDocumentSchema = z.object({
  applicationId: z
    .string()
    .min(5)
    .regex(/^SEVA-[A-Z0-9-]+$/i, 'Invalid Seva application ID format'),
  documentType: documentTypeEnum,
  fileName: z
    .string()
    .min(3)
    .regex(/^[\w\-.]+\.(pdf|jpg|jpeg|png)$/i, 'File name must have a valid .pdf, .jpg, or .png extension'),
  fileSizeKb: z
    .number()
    .positive('File size must be positive')
    .max(10240, 'File size cannot exceed 10 MB (10240 KB)'),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']).default('application/pdf'),
  phoneNumber: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits')
    .optional(),
});

export type AttachDocumentInput = z.infer<typeof attachDocumentSchema>;
