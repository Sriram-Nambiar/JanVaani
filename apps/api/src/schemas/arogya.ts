import { z } from 'zod';

export const arogyaCategorySchema = z.enum(['A', 'B', 'AUTO']);

export const arogyaEligibilitySchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 numeric digits'),
  phoneNumber: z.string().regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits'),
  rationCardType: z.enum(['BPL', 'AAY', 'APL', 'NONE']).default('BPL'),
  annualIncomeInr: z.number().nonnegative('Annual income cannot be negative').optional(),
  treatmentType: z.enum(['SIMPLE_SECONDARY', 'COMPLEX_SECONDARY', 'TERTIARY']).default('COMPLEX_SECONDARY'),
  district: z.string().min(2).default('Bengaluru Urban'),
});

export type ArogyaEligibilityInput = z.infer<typeof arogyaEligibilitySchema>;
