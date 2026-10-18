import { z } from 'zod';

export const arogyaCategorySchema = z.enum(['A', 'B', 'AUTO']);

export const arogyaEligibilitySchema = z.object({
  aadhaarNumber: z.string().min(12).max(14),
  phoneNumber: z.string().min(10).max(15),
  rationCardType: z.enum(['BPL', 'AAY', 'APL', 'NONE']).default('BPL'),
  annualIncomeInr: z.number().optional(),
  treatmentType: z.enum(['SIMPLE_SECONDARY', 'COMPLEX_SECONDARY', 'TERTIARY']).default('COMPLEX_SECONDARY'),
  district: z.string().min(2).default('Bengaluru Urban'),
});

export type ArogyaEligibilityInput = z.infer<typeof arogyaEligibilitySchema>;
