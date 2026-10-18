import { z } from 'zod';

export const verifyReceiptSchema = z.object({
  applicationId: z.string().optional(), // Intentional flaw: optional applicationId allows empty/missing id
  serviceId: z.string().default('bmtc-student-pass'),
  receiptHash: z.string().optional(), // Intentional flaw: doesn't enforce 64-char hex SHA256 format
  timestamp: z.string().optional(),
  studentName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export type VerifyReceiptInput = z.infer<typeof verifyReceiptSchema>;
