import { z } from 'zod';

export const escomEnum = z.enum([
  'BESCOM',
  'MESCOM',
  'HESCOM',
  'GESCOM',
  'CHESCOM',
]);

export const connectionTypeEnum = z.enum([
  'DOMESTIC_OWNER',
  'DOMESTIC_TENANT',
]);

export const gruhaJyothiCalculateSchema = z.object({
  consumerId: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Consumer Account ID must be exactly 10 numeric digits'),
  escom: escomEnum,
  connectionType: connectionTypeEnum,
  sanctionedLoadKw: z
    .number()
    .positive('Sanctioned load must be positive')
    .max(50, 'Sanctioned load exceeds residential limit of 50 kW')
    .default(2),
  averageAnnualConsumptionUnits: z
    .number()
    .nonnegative('Average annual consumption cannot be negative')
    .max(2000, 'Average annual consumption cannot exceed 2000 units'),
  currentMonthUnits: z
    .number()
    .nonnegative('Current month consumption cannot be negative')
    .max(5000, 'Current month consumption exceeds residential meter threshold'),
  meterReadingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Meter reading date must follow YYYY-MM-DD format')
    .optional(),
  contactPhone: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits')
    .optional(),
  consumerAadhaar: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 numeric digits')
    .optional(),
});

export type GruhaJyothiCalculateInput = z.infer<typeof gruhaJyothiCalculateSchema>;
