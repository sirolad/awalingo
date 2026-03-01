import { z } from 'zod';

// Schema for request validation
export const requestSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  meaning: z.string().min(1, 'Meaning is required'),
  sourceLanguageId: z.coerce.number().min(1, 'Source language is required'),
  targetLanguageId: z.coerce.number().min(1, 'Target language is required'),
  partOfSpeechId: z.coerce.number().min(1, 'Part of speech is required'),
  domains: z.array(z.string()).optional(),
});

export type SubmitRequestState = {
  errors?: {
    word?: string[];
    meaning?: string[];
    sourceLanguageId?: string[];
    targetLanguageId?: string[];
    partOfSpeechId?: string[];
    domains?: string[];
    userId?: string[];
    _form?: string[];
  };
  message?: string;
  success?: boolean;
};
