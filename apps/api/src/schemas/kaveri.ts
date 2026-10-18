import { z } from 'zod';

export const propertyTypeEnum = z.enum([
  'RESIDENTIAL_APARTMENT',
  'RESIDENTIAL_PLOT',
  'COMMERCIAL_PROPERTY',
  'AGRICULTURAL_LAND',
  'INDUSTRIAL_PROPERTY',
]);

export const urbanLocalBodyEnum = z.enum([
  'BBMP_CORE',
  'BBMP_PERIPHERY',
  'BMRDA',
  'CITY_MUNICIPAL_COUNCIL',
  'TOWN_PANCHAYAT',
  'GRAM_PANCHAYAT',
]);

export const transactionTypeEnum = z.enum([
  'SALE',
  'GIFT_FAMILY',
  'GIFT_NON_FAMILY',
  'LEASE',
  'MORTGAGE',
]);

export const kaveriCalculateSchema = z.object({
  propertyType: propertyTypeEnum,
  urbanLocalBody: urbanLocalBodyEnum,
  transactionType: transactionTypeEnum,
  areaSqFt: z
    .number()
    .positive('Property area in sq ft must be positive')
    .max(10_000_000, 'Property area exceeds maximum supported limit'),
  guidanceValuePerSqFt: z
    .number()
    .positive('Guidance value per sq ft must be positive')
    .max(1_000_000, 'Guidance value exceeds maximum limit'),
  declaredConsiderationInr: z
    .number()
    .nonnegative('Declared consideration cannot be negative')
    .max(100_000_000_000, 'Declared consideration exceeds maximum limit')
    .optional(),
  buyerAadhaar: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 numeric digits')
    .optional(),
  buyerPhone: z
    .string()
    .regex(/^(\+?\d{10,15})$/, 'Phone number must be between 10 and 15 digits')
    .optional(),
  district: z.string().trim().min(2).max(100).default('Bengaluru Urban'),
  subRegistrarOffice: z.string().trim().min(2).max(100).default('Gandhinagar SRO'),
});

export type KaveriCalculateInput = z.infer<typeof kaveriCalculateSchema>;
