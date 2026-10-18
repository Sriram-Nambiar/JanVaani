import { z } from 'zod';

export const mathrushreeCalculateSchema = z.object({
  motherAadhaar: z.string().min(12).max(14),
  motherPhone: z.string().min(10).max(15),
  motherAge: z.number().optional(), // Intentional: missing age bounds
  rationCardType: z.enum(['BPL', 'AAY', 'APL', 'NONE']).default('BPL'),
  livingChildrenCount: z.number().default(0),
  pregnancyTrimester: z.enum(['FIRST', 'SECOND', 'THIRD', 'POSTNATAL']).default('SECOND'),
  mcpCardNumber: z.string().optional(),
  district: z.string().min(2).default('Bengaluru Urban'),
});

export type MathrushreeCalculateInput = z.infer<typeof mathrushreeCalculateSchema>;
