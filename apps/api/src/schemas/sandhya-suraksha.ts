import { z } from 'zod';

export const sandhyaSurakshaSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 numeric digits'),
  phoneNumber: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits'),
  applicantName: z.string().min(2).default('Citizen'),
  age: z
    .number()
    .int('Age must be an integer')
    .min(18, 'Minimum age is 18')
    .max(125, 'Maximum age is 125'),
  annualIncomeInr: z
    .number()
    .nonnegative('Annual income cannot be negative')
    .optional(),
  areaType: z.enum(['RURAL', 'URBAN']).default('RURAL'),
  rationCardType: z.enum(['BPL', 'AAY', 'APL', 'NONE']).default('BPL'),
  district: z.string().min(2).default('Mandya'),
});

export type SandhyaSurakshaInput = z.infer<typeof sandhyaSurakshaSchema>;
