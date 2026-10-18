import { z } from 'zod';

export const casteCategoryEnum = z.enum([
  'CAT_1',
  'CAT_2A',
  'CAT_2B',
  'CAT_3A',
  'CAT_3B',
  'SC',
  'ST',
  'GENERAL',
]);

export const vidyasiriCalculateSchema = z.object({
  studentAadhaar: z.string().min(12).max(14),
  studentPhone: z.string().min(10).max(15),
  studentName: z.string().default('Student'),
  casteCategory: casteCategoryEnum,
  annualFamilyIncomeInr: z.number().optional(), // Intentional flaw: allows negative income
  distanceKm: z.number().optional(), // Intentional flaw: allows negative or < 5km distance
  residingInGovtHostel: z.boolean().default(false),
  courseLevel: z.enum(['PUC', 'DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE']).default('UNDERGRADUATE'),
  district: z.string().min(2).default('Dharwad'),
});

export type VidyasiriCalculateInput = z.infer<typeof vidyasiriCalculateSchema>;
