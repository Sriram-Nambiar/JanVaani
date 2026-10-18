import { z } from 'zod';

export const draftPdfSchema = z.object({
  ackNumber: z.string().trim().min(3).max(50),
  schemeId: z.enum(['gruha_jyothi', 'gruha_lakshmi', 'caste_income', 'bmtc_student_pass']),
  applicantName: z.string().trim().min(2).max(100),
  consumerId: z.string().trim().optional(),
  rationCardNumber: z.string().trim().optional(),
  aadhaarNumber: z.string().trim().optional(),
  annualIncome: z.string().trim().optional(),
  casteCategory: z.string().trim().optional(),
  escomName: z.string().trim().optional(),
  auditFindings: z
    .array(
      z.object({
        field: z.string(),
        status: z.enum(['PASSED', 'FLAGGED', 'WARNING']),
        noteKn: z.string(),
        noteEn: z.string(),
      })
    )
    .optional()
    .default([]),
});

export type DraftPdfInput = z.infer<typeof draftPdfSchema>;

export const statusPushSchema = z.object({
  ackNumber: z.string().trim().min(3).max(50),
  stage: z.enum(['APPROVED', 'REJECTED', 'DISPATCHED', 'FIELD_VERIFICATION', 'RESUBMIT_REQUIRED']),
  customMessageKn: z.string().trim().max(500).optional(),
});

export type StatusPushInput = z.infer<typeof statusPushSchema>;
