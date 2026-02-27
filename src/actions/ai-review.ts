'use server';

import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-auth';
import { logAudit } from '@/lib/audit';
import { Authorized } from '@/lib/auth/decorators';

const ReviewResultSchema = z.object({
  strictDict: z.enum(['Approved', 'Rejected', 'Needs Review']),
  reason: z.string(),
  score: z.number().min(0).max(100),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

class AiReviewActions {
  @Authorized('review:requests')
  static async analyzeRequest(request: {
    word: string;
    meaning?: string | null;
  }) {
    // We can assume user is authorized here because of the decorator
    // However, we still need the user object for logging, so we fetch it.
    // requireAuth() is cheap since it re-uses the session check.
    const { user } = await requireAuth();

    try {
      const { output } = await generateText({
        model: openai('gpt-4o-mini'),
        output: Output.object({ schema: ReviewResultSchema }),
        prompt: `
        You are a strict linguistic curator for a dictionary app called Awalingo.
        Your task is to review a "Translation Request" where a user asks for a translation of a specific word.

        Word: "${request.word}"
        Context/Meaning: "${request.meaning || 'No context provided'}"

        Criteria for Approval:
        1. The word must be a real word or concept in the source language, which is not always English.
        2. It must not be offensive, hate speech, or spam.
        3. The context (if provided) should clarify the intended meaning.

        Output JSON:
        - strictDict: "Approved" if valid, "Rejected" if spam/offensive, "Needs Review" if unsure.
        - reason: A short explanation (max 1 sentence).
        - score: Confidence score (0-100).
      `,
      });

      // Log AI usage for audit trail
      await logAudit({
        userId: user.id,
        action: 'ai:analyze:request',
        resourceId: request.word,
        metadata: { meaning: request.meaning, result: output.strictDict },
      });

      return { success: true, data: output };
    } catch (error) {
      console.error('AI Analysis failed:', error);
      return { success: false, error: 'Failed to analyze request' };
    }
  }
}

// Export the static method as a standalone function to maintain API compatibility
export async function analyzeRequest(request: {
  word: string;
  meaning?: string | null;
}) {
  return AiReviewActions.analyzeRequest(request);
}
