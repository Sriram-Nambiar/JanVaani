import { z } from 'zod';

export const citizenQuestionSchema = z.object({
  question: z
    .string({
      error: 'Question is required.',
    })
    .trim()
    .min(1, 'Question cannot be empty.')
    .max(1000, 'Question cannot exceed 1000 characters.'),
  language: z
    .enum(['kn', 'en'], {
      error: "Language must be either 'kn' or 'en'.",
    })
    .optional(),
});

export type CitizenQuestionInput = z.infer<typeof citizenQuestionSchema>;
