import { z } from 'zod';

export const verifyOtpSchema = z.object({
  otp: z.string().trim().min(1, 'OTP is required'),
  phoneNumber: z.string().trim().optional(),
});

export const bmtcApplicationSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, 'Student name must be at least 2 characters')
    .max(100, 'Student name cannot exceed 100 characters'),
  aadhaarNumber: z
    .string()
    .trim()
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 12;
    }, 'Aadhaar must be a 12-digit number (e.g., 4433 5010 5028)'),
  phoneNumber: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits'),
  institutionName: z
    .string()
    .trim()
    .min(3, 'Institution name must be at least 3 characters')
    .max(150, 'Institution name cannot exceed 150 characters'),
  courseYear: z
    .string()
    .trim()
    .min(1, 'Course and year cannot be empty')
    .max(50, 'Course and year cannot exceed 50 characters'),
  pickupStop: z
    .string()
    .trim()
    .min(2, 'Pickup stop must be at least 2 characters')
    .max(80, 'Pickup stop cannot exceed 80 characters'),
  destinationStop: z
    .string()
    .trim()
    .min(2, 'Destination stop must be at least 2 characters')
    .max(80, 'Destination stop cannot exceed 80 characters'),
  demoOtp: z.string().optional(),
  submittedVia: z.enum(['SEVA_PORTAL', 'JANVAANI_AI']).optional(),
  documents: z
    .array(
      z.object({
        documentType: z.string(),
        fileName: z.string(),
        verified: z.boolean(),
      })
    )
    .optional(),
});

export type BmtcApplicationInput = z.infer<typeof bmtcApplicationSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
