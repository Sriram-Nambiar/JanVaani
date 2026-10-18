import { z } from 'zod';

export const notificationTemplateEnum = z.enum([
  'SUBMISSION_CONFIRMED',
  'OTP_DISPATCHED',
  'DOCUMENT_VERIFIED',
  'STATUS_UPDATE',
]);

export const dispatchNotificationSchema = z.object({
  applicationId: z
    .string()
    .min(5)
    .regex(/^SEVA-[A-Z0-9-]+$/i, 'Invalid Seva application ID format'),
  recipientPhone: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Recipient phone number must be between 10 and 15 digits'),
  templateType: notificationTemplateEnum,
  language: z.enum(['kn', 'en']).default('kn'),
});

export type DispatchNotificationInput = z.infer<typeof dispatchNotificationSchema>;
