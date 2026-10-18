import { z } from 'zod';

export const sandhyaSurakshaSchema = z.object({
  aadhaarNumber: z.string().min(12).max(14),
  phoneNumber: z.string().min(10).max(15),
  applicantName: z.string().min(2).default('Citizen'),
  age: z.number().optional(), // Intentional flaw: allows age < 65, negative, or undefined
  annualIncomeInr: z.number().optional(), // Intentional flaw: allows negative income
  areaType: z.enum(['RURAL', 'URBAN']).default('RURAL'),
  rationCardType: z.enum(['BPL', 'AAY', 'APL', 'NONE']).default('BPL'),
  district: z.string().min(2).default('Mandya'),
});

export type SandhyaSurakshaInput = z.infer<typeof sandhyaSurakshaSchema>;
