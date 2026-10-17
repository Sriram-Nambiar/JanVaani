import { z } from 'zod';

export const rtcEnum = z.enum(['KSRTC', 'BMTC', 'NWKRTC', 'KKRTC']);

export const busCategoryEnum = z.enum([
  'ORDINARY',
  'EXPRESS',
  'NAGARA_SARIGE',
  'RAJAHAMSA',
  'AIRAVAT',
  'EV_AC',
]);

export const shaktiPassApplySchema = z.object({
  applicantName: z.string().trim().min(2, 'Applicant name is required').max(100),
  gender: z.literal('FEMALE'),
  isKarnatakaDomicile: z.boolean(),
  aadhaarNumber: z.string().trim().min(12, 'Aadhaar must be at least 12 digits').max(14),
  preferredRtc: rtcEnum,
  district: z.string().trim().min(2).max(50),
});

export type ShaktiPassApplyInput = z.infer<typeof shaktiPassApplySchema>;

export const shaktiRouteCheckSchema = z.object({
  rtc: rtcEnum,
  busCategory: busCategoryEnum,
  origin: z.string().trim().min(2).max(50),
  destination: z.string().trim().min(2).max(50),
});

export type ShaktiRouteCheckInput = z.infer<typeof shaktiRouteCheckSchema>;

export const shaktiPassLookupParamSchema = z.object({
  passNumber: z.string().trim().min(5).max(40),
});

export type ShaktiPassLookupParamInput = z.infer<typeof shaktiPassLookupParamSchema>;
