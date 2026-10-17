import { z } from 'zod';

export const qrVerificationParamSchema = z.object({
  ackNumber: z.string().trim().min(3, 'Acknowledgment number must be at least 3 characters').max(50),
});

export type QrVerificationParamInput = z.infer<typeof qrVerificationParamSchema>;
