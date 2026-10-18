import { z } from 'zod';

export const mathrushreeCalculateSchema = z.object({
  motherAadhaar: z
    .string()
    .regex(/^\d{12}$/, 'Mother Aadhaar number must be exactly 12 numeric digits'),
  motherPhone: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Mother phone number must be between 10 and 15 digits'),
  motherAge: z
    .number()
    .int('Age must be an integer')
    .min(18, 'Minimum legal adult age is 18')
    .max(65, 'Maximum age is 65')
    .optional(),
  rationCardType: z.enum(['BPL', 'AAY', 'APL', 'NONE']).default('BPL'),
  livingChildrenCount: z
    .number()
    .int('Count must be an integer')
    .min(0, 'Living children count cannot be negative')
    .max(10, 'Living children count cannot exceed 10')
    .default(0),
  pregnancyTrimester: z.enum(['FIRST', 'SECOND', 'THIRD', 'POSTNATAL']).default('SECOND'),
  mcpCardNumber: z.string().optional(),
  district: z.string().min(2).default('Bengaluru Urban'),
});

export type MathrushreeCalculateInput = z.infer<typeof mathrushreeCalculateSchema>;
