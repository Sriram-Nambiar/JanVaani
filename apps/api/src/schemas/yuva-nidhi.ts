import { z } from 'zod';

export const qualificationEnum = z.enum(['GRADUATE', 'DIPLOMA', 'POST_GRADUATE']);

export const yuvaNidhiCheckSchema = z.object({
  educationRegNo: z.string().trim().min(3, 'Registration number must be at least 3 characters').max(30),
  applicantName: z.string().trim().min(2, 'Applicant name is required').max(100),
  qualification: qualificationEnum,
  passingYear: z.number().int().min(2020).max(2026),
  monthsUnemployed: z.number().int().nonnegative(),
  isEmployed: z.boolean(),
  isPursuingHigherStudies: z.boolean(),
  isKarnatakaDomicile: z.boolean(),
  rationCardNumber: z.string().trim().min(8).max(20).optional(),
});

export type YuvaNidhiCheckInput = z.infer<typeof yuvaNidhiCheckSchema>;

export const yuvaNidhiLookupParamSchema = z.object({
  educationRegNo: z.string().trim().min(3, 'Registration number must be at least 3 characters').max(30),
});

export type YuvaNidhiLookupParamInput = z.infer<typeof yuvaNidhiLookupParamSchema>;
