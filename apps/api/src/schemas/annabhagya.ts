import { z } from 'zod';

export const annaBhagyaCardTypeSchema = z.enum(['BPL', 'AAY', 'APL']);
export type AnnaBhagyaCardType = z.infer<typeof annaBhagyaCardTypeSchema>;

export const annaBhagyaCalculateSchema = z.object({
  rationCardNumber: z
    .string()
    .trim()
    .min(10, 'Ration card number must be at least 10 characters')
    .max(15, 'Ration card number must not exceed 15 characters'),
  cardType: annaBhagyaCardTypeSchema,
  memberCount: z
    .number()
    .int('Member count must be an integer')
    .min(1, 'At least 1 family member is required')
    .max(20, 'Maximum family members allowed is 20'),
  dbtBankLinked: z.boolean().default(true),
  headOfFamilyName: z.string().trim().min(2, 'Name must have at least 2 characters'),
  district: z.string().trim().default('Bengaluru Urban'),
});

export type AnnaBhagyaCalculateInput = z.infer<typeof annaBhagyaCalculateSchema>;

export const annaBhagyaLookupParamSchema = z.object({
  rcNumber: z.string().trim().min(5),
});

export type AnnaBhagyaLookupParam = z.infer<typeof annaBhagyaLookupParamSchema>;
