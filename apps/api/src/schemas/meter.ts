import { z } from 'zod';

export const escomEnum = z.enum(['BESCOM', 'MESCOM', 'HESCOM', 'GESCOM', 'CHESCOM']);

export const meterCalculationSchema = z.object({
  rrNumber: z.string().trim().min(3, 'RR number must be at least 3 characters').max(30),
  escomName: escomEnum,
  previousReading: z.number().nonnegative('Previous reading must be non-negative'),
  currentReading: z.number().nonnegative('Current reading must be non-negative'),
  averageMonthlyUnits: z.number().positive().max(500).optional().default(150),
  consumerPhone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(15).optional(),
});

export type MeterCalculationInput = z.infer<typeof meterCalculationSchema>;

export const meterLookupParamSchema = z.object({
  rrNumber: z.string().trim().min(3, 'RR number must be at least 3 characters').max(30),
});

export type MeterLookupParamInput = z.infer<typeof meterLookupParamSchema>;
