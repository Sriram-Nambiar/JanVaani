import { z } from 'zod';

export const arogyaCategorySchema = z.enum(['A', 'B', 'AUTO']);

export const arogyaEligibilitySchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 numeric digits'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be a valid 10-digit Indian mobile number'),
  rationCardType: z.enum(['BPL', 'AAY', 'APL', 'NONE']).default('BPL'),
  annualIncomeInr: z.number().nonnegative('Annual income cannot be negative').max(10000000).optional(),
  treatmentType: z.enum(['SIMPLE_SECONDARY', 'COMPLEX_SECONDARY', 'TERTIARY']).default('COMPLEX_SECONDARY'),
  district: z.string().min(2).default('Bengaluru Urban'),
});

export type ArogyaEligibilityInput = z.infer<typeof arogyaEligibilitySchema>;
