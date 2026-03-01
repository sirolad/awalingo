'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';
import { Authorized } from '@/lib/auth/decorators';

export interface QuizOption {
  label: string;
  value: string;
}

export interface QuizQuestionInput {
  languageId: number;
  text: string;
  options: QuizOption[];
  correctAnswer: string;
}

export async function addQuizQuestion(data: QuizQuestionInput) {
  try {
    const question = await prisma.quizQuestion.create({
      data: {
        languageId: data.languageId,
        text: data.text,
        options: data.options as unknown as Prisma.InputJsonValue,
        correctAnswer: data.correctAnswer,
        isActive: true,
      },
    });
    revalidatePath('/admin/quiz');
    return { success: true, question };
  } catch (error) {
    console.error('Failed to add quiz question:', error);
    return { success: false, error: 'Failed to add quiz question' };
  }
}

export async function bulkAddQuizQuestions(questions: QuizQuestionInput[]) {
  try {
    const result = await prisma.quizQuestion.createMany({
      data: questions.map(q => ({
        ...q,
        options: q.options as unknown as Prisma.InputJsonValue,
        isActive: true,
      })),
    });
    revalidatePath('/admin/quiz');
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Failed to bulk add quiz questions:', error);
    return { success: false, error: 'Failed to bulk add questions' };
  }
}

export async function getAdminQuizQuestions(
  languageId: number,
  page: number = 1,
  limit: number = 20,
  searchQuery?: string
) {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.QuizQuestionWhereInput = {
      languageId,
      ...(searchQuery
        ? {
            text: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [questions, totalCount] = await prisma.$transaction([
      prisma.quizQuestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quizQuestion.count({ where }),
    ]);

    return {
      success: true,
      questions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error('Failed to get admin quiz questions:', error);
    return { success: false, error: 'Failed to fetch questions' };
  }
}

export async function getQuizQuestionCount() {
  try {
    const count = await prisma.quizQuestion.count();
    return { success: true, count };
  } catch (error) {
    console.error('Failed to get quiz question count:', error);
    return { success: false, count: 0 };
  }
}

export async function updateQuizQuestion(
  id: number,
  data: Partial<QuizQuestionInput> & { isActive?: boolean }
) {
  try {
    const question = await prisma.quizQuestion.update({
      where: { id },
      data: {
        ...(data.languageId !== undefined && { languageId: data.languageId }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.options !== undefined && {
          options: data.options as unknown as Prisma.InputJsonValue,
        }),
        ...(data.correctAnswer !== undefined && {
          correctAnswer: data.correctAnswer,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    revalidatePath('/admin/quiz');
    return { success: true, question };
  } catch (error) {
    console.error('Failed to update quiz question:', error);
    return { success: false, error: 'Failed to update question' };
  }
}

export async function deleteQuizQuestion(id: number) {
  try {
    await prisma.quizQuestion.delete({
      where: { id },
    });
    revalidatePath('/admin/quiz');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete quiz question:', error);
    return { success: false, error: 'Failed to delete question' };
  }
}

export async function getCuratorTestQuestions(userId: string) {
  try {
    // 1. Get user's primary target language
    const targetLanguage = await prisma.userTargetLanguage.findFirst({
      where: { userId },
      include: { language: true },
    });

    if (!targetLanguage) {
      return { success: false, error: 'No target language selected' };
    }

    // 2. Determine number of questions (default to 10 limit)
    const limitArray = parseInt(process.env.QUIZ_QUESTION_COUNT || '10', 10);
    const limit = isNaN(limitArray) ? 10 : limitArray;

    // 3. Fetch active questions randomized
    // Note: Prisma does not have a native "ORDER BY RAND()",
    // so we fetch all matches and shuffle in memory or pick top N if not a huge dataset.
    // Given the context and standard Prisma workarounds for Postgres:

    // Postgres workaround for random ordering
    const questions = await prisma.$queryRaw<
      Array<{
        id: number;
        text: string;
        options: Prisma.JsonValue; // Stored as Json
        correctAnswer: string;
        languageId: number;
      }>
    >`
      SELECT id, text, options, "correctAnswer", "languageId"
      FROM quiz_questions
      WHERE "languageId" = ${targetLanguage.languageId} AND "isActive" = true
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    return { success: true, questions };
  } catch (error) {
    console.error('Failed to get curator test questions:', error);
    return { success: false, error: 'Failed to retrieve test questions' };
  }
}

export interface QuizEligibilityResult {
  success: boolean;
  canTake?: boolean;
  reason?: string | null;
  eligibleAt?: Date;
  error?: string;
  roleName?: string;
}

class QuizEligibility {
  @Authorized('take:quiz')
  static async check(userId: string): Promise<QuizEligibilityResult> {
    // Permission is guaranteed by decorator
    // Check for recent failures (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentFailure = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        passed: false,
        createdAt: {
          gte: twoWeeksAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentFailure) {
      const eligibilityDate = new Date(recentFailure.createdAt);
      eligibilityDate.setDate(eligibilityDate.getDate() + 14);
      return {
        success: true,
        canTake: false,
        reason: 'Cooldown period active.',
        eligibleAt: eligibilityDate,
      };
    }

    return { success: true, canTake: true, reason: null };
  }
}

export async function canUserTakeQuiz(
  userId: string
): Promise<QuizEligibilityResult> {
  try {
    const result = await QuizEligibility.check(userId);

    // Check if the decorator blocked access
    if (
      !result.success &&
      result.error &&
      !Object.prototype.hasOwnProperty.call(result, 'canTake')
    ) {
      return {
        success: false,
        canTake: false,
        reason: 'User is already a curator or admin.',
        roleName: undefined, // Role name not directly returned by standard error
        eligibleAt: undefined,
      };
    }

    return result as QuizEligibilityResult;
  } catch (error) {
    console.error('Failed to check quiz eligibility:', error);
    return {
      success: false,
      canTake: false,
      error: 'Error checking eligibility',
    };
  }
}

export async function submitQuizAttempt(
  userId: string,
  score: number,
  totalQuestions: number
) {
  try {
    const percentage = score / totalQuestions;
    const passed = percentage >= 0.75; // 75% pass rate

    await prisma.$transaction(async tx => {
      // 1. Record the attempt
      await tx.quizAttempt.create({
        data: {
          userId,
          score,
          passed,
        },
      });

      // 2. Upgrade role if passed
      if (passed) {
        const contributorRole = await tx.role.findUnique({
          where: { name: 'CONTRIBUTOR' }, // Upgrading to CONTRIBUTOR based on assumptions
        });

        if (contributorRole) {
          // Delete existing EXPLORER role and add CONTRIBUTOR
          await tx.userRole.deleteMany({
            where: { userId },
          });

          await tx.userRole.create({
            data: {
              userId,
              roleId: contributorRole.id,
            },
          });
        }
      }
    });

    revalidatePath('/curator-test');
    revalidatePath('/home');
    revalidatePath('/profile');

    return { success: true, passed, percentage };
  } catch (error) {
    console.error('Failed to submit quiz attempt:', error);
    return { success: false, error: 'Failed to process quiz submission' };
  }
}
