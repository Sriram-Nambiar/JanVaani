import { z } from 'zod';

export const tatkalCategoryEnum = z.enum([
  'MEDICAL_EMERGENCY',
  'EDUCATIONAL_EXAM',
  'EMPLOYMENT_INTERVIEW',
  'BEREAVEMENT_TRAVEL',
]);

export const requestTatkalSchema = z.object({
  applicationId: z
    .string()
    .min(5)
    .regex(/^SEVA-[A-Z0-9-]+$/i, 'Invalid Seva Sindhu application ID format'),
  tatkalCategory: tatkalCategoryEnum,
  justification: z
    .string()
    .trim()
    .min(10, 'Justification must be at least 10 characters')
    .max(500, 'Justification cannot exceed 500 characters'),
  supportingDocName: z
    .string()
    .trim()
    .min(3, 'Supporting document name must be provided')
    .max(100),
  phoneNumber: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits')
    .optional(),
  channel: z.enum(['PORTAL', 'GRAMA_ONE_KIOSK', 'HELPLINE_1902']).default('PORTAL'),
});

export type RequestTatkalInput = z.infer<typeof requestTatkalSchema>;
