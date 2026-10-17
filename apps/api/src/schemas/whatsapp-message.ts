import { z } from 'zod';

export const whatsappMessageSchema = z.object({
  senderId: z
    .string({ error: 'Sender ID is required.' })
    .trim()
    .min(1, 'Sender ID cannot be empty.')
    .default('citizen-guest'),
  type: z.enum(['voice', 'image', 'text'], {
    error: "Message type must be 'voice', 'image', or 'text'.",
  }),
  // For voice messages: base64 audio string or audio URL or audio transcript fallback
  audioBase64: z.string().optional(),
  audioUrl: z.string().url().optional(),
  mimeType: z.string().optional().default('audio/ogg'),
  
  // For document messages: base64 image string or image URL
  imageBase64: z.string().optional(),
  imageUrl: z.string().url().optional(),
  documentType: z.enum(['aadhaar', 'ration_card', 'income_certificate', 'generic']).optional().default('generic'),
  
  // For text messages or transcribed queries:
  text: z.string().trim().max(1000).optional(),
  
  // Useful for hackathon live demos without needing live mic:
  presetScenario: z
    .enum([
      'gruha_lakshmi_apply',
      'caste_income_apply',
      'gruha_jyothi_apply',
      'gruha_jyothi_submit_agent',
      'document_check_mismatch',
      'document_check_valid',
      'status_check_rd001',
      'status_check_rd002',
      'status_check_rd003',
    ])
    .optional(),
}).refine(
  (data) => {
    if (data.type === 'voice') {
      return Boolean(data.audioBase64 || data.audioUrl || data.text || data.presetScenario);
    }
    if (data.type === 'image') {
      return Boolean(data.imageBase64 || data.imageUrl || data.presetScenario);
    }
    if (data.type === 'text') {
      return Boolean(data.text || data.presetScenario);
    }
    return true;
  },
  {
    message: 'Appropriate payload (audio, image, text, or presetScenario) must be provided for the selected message type.',
    path: ['type'],
  }
);

export type WhatsAppMessageInput = z.infer<typeof whatsappMessageSchema>;

export const sevaSindhuSubmissionSchema = z.object({
  schemeId: z.literal('gruha_jyothi'),
  fields: z.object({
    applicantName: z.string().trim().min(2, 'Applicant name must be at least 2 characters').max(100),
    consumerId: z.string().trim().min(5, 'Valid Consumer/Account ID is required').max(30),
    escomName: z.enum(['BESCOM', 'HESCOM', 'GESCOM', 'MESCOM', 'CESC']),
    aadhaarNumber: z.string().trim().max(20).optional(),
    occupancyType: z.enum(['Owner', 'Tenant']).optional(),
  }),
});

export type SevaSindhuSubmissionInput = z.infer<typeof sevaSindhuSubmissionSchema>;
