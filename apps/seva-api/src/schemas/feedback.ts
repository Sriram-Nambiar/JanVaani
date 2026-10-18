import { z } from 'zod';

export const feedbackCategoryEnum = z.enum([
  'SPEED_OF_SERVICE',
  'DOCUMENT_CLARITY',
  'STAFF_HELPFULNESS',
  'TECHNICAL_GLITCH',
  'GENERAL_EXPERIENCE',
]);

export const submitFeedbackSchema = z.object({
  applicationId: z
    .string()
    .min(5)
    .regex(/^SEVA-[A-Z0-9-]+$/i, 'Invalid Seva Sindhu application ID format'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  category: feedbackCategoryEnum,
  comment: z.string().trim().max(500, 'Comment cannot exceed 500 characters').optional(),
  phoneNumber: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits')
    .optional(),
  channel: z.enum(['PORTAL', 'WHATSAPP_BOT', 'GRAMA_ONE_KIOSK']).default('PORTAL'),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
