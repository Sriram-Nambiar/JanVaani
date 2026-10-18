import { z } from 'zod';

export const dispatchNotificationSchema = z.object({
  applicationId: z.string().min(5),
  recipientPhone: z.string().optional(), // Intentional flaw: optional loose phone
  templateType: z.string().optional(), // Intentional flaw: unconstrained templateType string
  language: z.enum(['kn', 'en']).default('kn'),
});

export type DispatchNotificationInput = z.infer<typeof dispatchNotificationSchema>;
