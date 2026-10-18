import { z } from 'zod';

export const departmentEnum = z.enum([
  'BESCOM',
  'BWSSB',
  'BBMP',
  'REVENUE',
  'KSRTC',
]);

export const grievanceEscalationSchema = z.object({
  grievanceId: z
    .string()
    .min(4)
    .regex(/^GRV-[A-Z0-9-]+$/i, 'Grievance ID must match format GRV-XXXX-XXXX'),
  department: departmentEnum,
  complainantPhone: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Complainant phone number must be between 10 and 15 digits')
    .optional(),
  complainantName: z.string().max(80).optional(),
  elapsedDays: z
    .number()
    .int('Elapsed days must be an integer')
    .nonnegative('Elapsed days cannot be negative')
    .max(365, 'Elapsed days cannot exceed 365')
    .default(0),
  category: z.string().default('GENERAL_CIVIC'),
  district: z.string().min(2).default('Bengaluru Urban'),
});

export type GrievanceEscalationInput = z.infer<typeof grievanceEscalationSchema>;
