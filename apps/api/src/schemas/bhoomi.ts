import { z } from 'zod';

export const bhoomiRtcFetchSchema = z.object({
  district: z.string().trim().min(2, 'District is required'),
  taluk: z.string().trim().min(2, 'Taluk is required'),
  hobli: z.string().trim().min(2, 'Hobli is required'),
  village: z.string().trim().min(2, 'Village is required'),
  surveyNumber: z.string().trim().min(1, 'Survey number is required'),
  surnoc: z.string().trim().default('*'),
  hissaNumber: z.string().trim().default('1'),
  ownerAadhaar: z
    .string()
    .trim()
    .length(12, 'Aadhaar must be exactly 12 digits')
    .regex(/^\d{12}$/, 'Aadhaar must contain only digits')
    .optional(),
});

export type BhoomiRtcFetchInput = z.infer<typeof bhoomiRtcFetchSchema>;

export const bhoomiRtcLookupParamSchema = z.object({
  rtcNumber: z.string().trim().min(5),
});

export type BhoomiRtcLookupParam = z.infer<typeof bhoomiRtcLookupParamSchema>;
