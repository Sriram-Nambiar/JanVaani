import { z } from 'zod';

export const verifyReceiptSchema = z.object({
  applicationId: z
    .string()
    .min(5)
    .regex(/^SEVA-[A-Z0-9-]+$/i, 'Invalid Seva application ID format'),
  serviceId: z.string().min(3).default('bmtc-student-pass'),
  receiptHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, 'Receipt hash must be a 64-character hexadecimal SHA-256 string'),
});

export type VerifyReceiptInput = z.infer<typeof verifyReceiptSchema>;
