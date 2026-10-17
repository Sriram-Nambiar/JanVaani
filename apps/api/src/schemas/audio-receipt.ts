import { z } from 'zod';

export const audioReceiptSchema = z.object({
  ackNumber: z.string().trim().min(3, 'Acknowledgment number must be at least 3 characters').max(50),
  schemeId: z.enum(['gruha_jyothi', 'gruha_lakshmi', 'caste_income']),
  applicantName: z.string().trim().min(2, 'Applicant name is required').max(100),
  consumerId: z.string().trim().max(30).optional(),
  rationCardNumber: z.string().trim().max(30).optional(),
  annualIncome: z.string().trim().max(20).optional(),
  district: z.string().trim().max(50).optional().default('Bengaluru Urban'),
  preferredLanguage: z.enum(['kn', 'en']).optional().default('kn'),
});

export type AudioReceiptInput = z.input<typeof audioReceiptSchema>;
export type AudioReceiptOutput = z.output<typeof audioReceiptSchema>;
