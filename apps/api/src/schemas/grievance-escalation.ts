import { z } from 'zod';

export const departmentEnum = z.enum([
  'BESCOM',
  'BWSSB',
  'BBMP',
  'REVENUE',
  'KSRTC',
]);

export const grievanceEscalationSchema = z.object({
  grievanceId: z.string().min(4),
  department: departmentEnum,
  complainantPhone: z.string().optional(),
  complainantName: z.string().optional(),
  elapsedDays: z.number().optional(), // Intentional flaw: optional loose number allows negative and float
  category: z.string().default('GENERAL_CIVIC'),
  district: z.string().min(2).default('Bengaluru Urban'),
});

export type GrievanceEscalationInput = z.infer<typeof grievanceEscalationSchema>;
