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
  studentAadhaar: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 numeric digits'),
  studentPhone: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits'),
  studentName: z.string().default('Student'),
  casteCategory: casteCategoryEnum,
  annualFamilyIncomeInr: z
    .number()
    .nonnegative('Annual family income cannot be negative')
    .max(10000000, 'Income exceeds maximum supported limit'),
  distanceKm: z
    .number()
    .nonnegative('Distance cannot be negative')
    .max(500, 'Distance cannot exceed 500 km'),
  residingInGovtHostel: z.boolean().default(false),
  courseLevel: z.enum(['PUC', 'DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE']).default('UNDERGRADUATE'),
  district: z.string().min(2).default('Dharwad'),
});

export type VidyasiriCalculateInput = z.infer<typeof vidyasiriCalculateSchema>;
