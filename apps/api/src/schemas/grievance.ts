import { z } from 'zod';

export const grievanceSubmissionSchema = z.object({
  ackNumber: z.string().trim().max(50).optional(),
  applicantName: z.string().trim().min(2, 'Applicant name is required').max(100),
  phone: z.string().trim().min(10, 'Valid 10-digit phone number is required').max(15),
  district: z.string().trim().min(2, 'District is required').max(50),
  department: z.enum([
    'ENERGY_BESCOM',
    'WOMEN_AND_CHILD',
    'REVENUE_NADAKACHERI',
    'FOOD_AND_CIVIL_SUPPLIES',
  ]),
  grievanceCategory: z.enum([
    'UNJUST_REJECTION',
    'SERVICE_DELAY',
    'NAME_MISMATCH_HELP',
    'OFFICER_ESCALATION',
  ]),
  description: z.string().trim().min(5, 'Grievance description must be at least 5 characters').max(1000),
  preferredLanguage: z.enum(['kn', 'en']).default('kn'),
});

export type GrievanceSubmissionInput = z.infer<typeof grievanceSubmissionSchema>;
