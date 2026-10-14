import { z } from 'zod';

export const serviceLookupSchema = z.object({
  query: z
    .string({
      error: 'Search query is required.',
    })
    .trim()
    .min(1, 'Search query cannot be empty.')
    .max(200, 'Search query cannot exceed 200 characters.'),
  department: z
    .string()
    .trim()
    .min(1, 'Department cannot be empty.')
    .max(100, 'Department cannot exceed 100 characters.')
    .optional(),
  language: z
    .enum(['kn', 'en'], {
      error: "Language must be either 'kn' or 'en'.",
    })
    .optional(),
  page: z.coerce
    .number({ error: 'Page must be a valid number.' })
    .int('Page must be an integer.')
    .min(1, 'Page must be at least 1.')
    .default(1),
  limit: z.coerce
    .number({ error: 'Limit must be a valid number.' })
    .int('Limit must be an integer.')
    .min(1, 'Limit must be at least 1.')
    .max(100, 'Limit cannot exceed 100.')
    .default(10),
});

export type ServiceLookupQuery = z.infer<typeof serviceLookupSchema>;
