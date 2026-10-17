import { z } from 'zod';

export const gruhaJyothiFieldsSchema = z.object({
  applicantName: z.string().trim().min(2, 'Applicant name must be at least 2 characters').max(100),
  consumerId: z.string().trim().min(5, 'Valid Consumer/Account ID is required').max(30),
  escomName: z.enum(['BESCOM', 'HESCOM', 'GESCOM', 'MESCOM', 'CESC']),
  aadhaarNumber: z.string().trim().max(20).optional(),
  occupancyType: z.enum(['Owner', 'Tenant']).optional().default('Tenant'),
});

export const gruhaLakshmiFieldsSchema = z.object({
  applicantName: z.string().trim().min(2, 'Applicant name must be at least 2 characters').max(100),
  rationCardNumber: z.string().trim().min(8, 'Ration Card number must be at least 8 characters').max(25),
  aadhaarNumber: z.string().trim().min(12, '12-digit Aadhaar number required').max(16),
  bankAccountNumber: z.string().trim().min(9, 'Bank account number must be at least 9 digits').max(20),
  ifscCode: z.string().trim().min(11, 'Valid 11-character IFSC code is required').max(11),
  npciSeedingConfirmed: z.boolean().optional().default(true),
});

export const casteIncomeFieldsSchema = z.object({
  applicantName: z.string().trim().min(2, 'Applicant name must be at least 2 characters').max(100),
  parentOrSpouseName: z.string().trim().min(2, 'Parent or spouse name is required').max(100),
  category: z.enum(['Category-1', 'Category-2A', 'Category-2B', 'Category-3A', 'Category-3B', 'SC', 'ST', 'General']),
  caste: z.string().trim().min(2, 'Caste designation is required').max(50),
  annualIncome: z.number().nonnegative('Annual income must be a positive number').max(10000000),
  taluk: z.string().trim().min(2, 'Taluk name is required').max(50),
  district: z.string().trim().min(2, 'District name is required').max(50),
});

export const sevaSindhuSubmissionSchema = z.discriminatedUnion('schemeId', [
  z.object({
    schemeId: z.literal('gruha_jyothi'),
    fields: gruhaJyothiFieldsSchema,
  }),
  z.object({
    schemeId: z.literal('gruha_lakshmi'),
    fields: gruhaLakshmiFieldsSchema,
  }),
  z.object({
    schemeId: z.literal('caste_income'),
    fields: casteIncomeFieldsSchema,
  }),
]);

export type SevaSindhuSubmissionInput = z.infer<typeof sevaSindhuSubmissionSchema>;
export type GruhaJyothiFields = z.infer<typeof gruhaJyothiFieldsSchema>;
export type GruhaLakshmiFields = z.infer<typeof gruhaLakshmiFieldsSchema>;
export type CasteIncomeFields = z.infer<typeof casteIncomeFieldsSchema>;
