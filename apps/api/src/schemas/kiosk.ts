import { z } from 'zod';

export const kioskTokenIssueSchema = z.object({
  citizenName: z.string().trim().min(2, 'Citizen name must be at least 2 characters').max(100),
  phone: z.string().trim().min(10, 'Valid 10-digit phone number is required').max(15),
  serviceType: z.enum([
    'GRUHA_JYOTHI',
    'GRUHA_LAKSHMI',
    'CASTE_INCOME',
    'JANASPANDANA_GRIEVANCE',
    'DOCUMENT_VERIFICATION',
  ]),
  village: z.string().trim().max(100).optional().default('Nelamangala'),
  taluk: z.string().trim().max(100).optional().default('Bengaluru Rural'),
  counterNumber: z.number().int().min(1).max(10).optional().default(1),
});

export type KioskTokenIssueInput = z.input<typeof kioskTokenIssueSchema>;
export type KioskTokenIssueOutput = z.output<typeof kioskTokenIssueSchema>;

export const kioskCallNextSchema = z.object({
  counterNumber: z.number().int().min(1).max(10).default(1),
});

export type KioskCallNextInput = z.infer<typeof kioskCallNextSchema>;
