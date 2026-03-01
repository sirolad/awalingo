import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addQuizQuestion,
  bulkAddQuizQuestions,
  getCuratorTestQuestions,
  canUserTakeQuiz,
  submitQuizAttempt,
} from '../quiz';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mock Prisma
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    quizQuestion: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    quizAttempt: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    userTargetLanguage: {
      findFirst: vi.fn(),
    },
    userRole: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  };

  return {
    __esModule: true,
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Server Auth
vi.mock('@/lib/auth/server-auth', () => ({
  requirePermission: vi.fn(),
}));

import { requirePermission } from '@/lib/auth/server-auth';

describe('Quiz Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addQuizQuestion', () => {
    it('should successfully add a single question', async () => {
      const mockData = {
        languageId: 1,
        text: 'Test Question?',
        options: [{ label: 'A', value: 'Option A' }],
        correctAnswer: 'Option A',
      };

      (prisma.quizQuestion.create as any).mockResolvedValue({
        id: 1,
        ...mockData,
      });

      const result = await addQuizQuestion(mockData);

      expect(prisma.quizQuestion.create).toHaveBeenCalledWith({
        data: {
          ...mockData,
          isActive: true,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin/quiz');
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (prisma.quizQuestion.create as any).mockRejectedValue(
        new Error('DB Error')
      );

      const result = await addQuizQuestion({
        languageId: 1,
        text: 'Test',
        options: [],
        correctAnswer: 'A',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add quiz question');
    });
  });

  describe('bulkAddQuizQuestions', () => {
    it('should add multiple questions and return count', async () => {
      const questions = [
        { languageId: 1, text: 'Q1', options: [], correctAnswer: 'A' },
        { languageId: 1, text: 'Q2', options: [], correctAnswer: 'B' },
      ];

      (prisma.quizQuestion.createMany as any).mockResolvedValue({ count: 2 });

      const result = await bulkAddQuizQuestions(questions);

      expect(prisma.quizQuestion.createMany).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if ('count' in result) {
        expect(result.count).toBe(2);
      }
    });
  });

  describe('getCuratorTestQuestions', () => {
    it('should return error if no target language found', async () => {
      (prisma.userTargetLanguage.findFirst as any).mockResolvedValue(null);

      const result = await getCuratorTestQuestions('user1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No target language selected');
    });

    it('should return questions if target language exists', async () => {
      (prisma.userTargetLanguage.findFirst as any).mockResolvedValue({
        languageId: 1,
      });
      (prisma.$queryRaw as any).mockResolvedValue([{ id: 1, text: 'Q1' }]);

      const result = await getCuratorTestQuestions('user1');

      expect(result.success).toBe(true);
      if ('questions' in result) {
        expect(result.questions).toHaveLength(1);
      }
    });
  });

  describe('canUserTakeQuiz', () => {
    it('should return false if user is not EXPLORER', async () => {
      (requirePermission as any).mockRejectedValue(new Error('Unauthorized'));

      const result = await canUserTakeQuiz('user1');

      expect(result.success).toBe(false);
      expect(result.canTake).toBe(false);
      expect(result.reason).toBe('User is already a curator or admin.');
    });

    it('should return false if cooldown is active', async () => {
      (requirePermission as any).mockResolvedValue(undefined);
      const recentDate = new Date();
      (prisma.quizAttempt.findFirst as any).mockResolvedValue({
        id: 1,
        passed: false,
        createdAt: recentDate,
      });

      const result = await canUserTakeQuiz('user1');

      expect(result.success).toBe(true);
      expect(result.canTake).toBe(false);
      expect(result.reason).toBe('Cooldown period active.');
    });

    it('should return true if EXPLORER and no recent failures', async () => {
      (requirePermission as any).mockResolvedValue(undefined);
      (prisma.quizAttempt.findFirst as any).mockResolvedValue(null);

      const result = await canUserTakeQuiz('user1');

      expect(result.success).toBe(true);
      expect(result.canTake).toBe(true);
    });
  });

  describe('submitQuizAttempt', () => {
    it('should process a failing score without role upgrade', async () => {
      // 2 / 5 = 40%
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb(prisma); // Execute transaction with mock prisma
      });

      const result = await submitQuizAttempt('user1', 2, 5);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ score: 2, passed: false }),
      });
      expect(prisma.userRole.create).not.toHaveBeenCalled();

      expect(result.success).toBe(true);
      if ('passed' in result) {
        expect(result.passed).toBe(false);
      }
    });

    it('should process a passing score and upgrade role', async () => {
      // 4 / 5 = 80%
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(prisma)
      );
      (prisma.role.findUnique as any).mockResolvedValue({
        id: 2,
        name: 'CONTRIBUTOR',
      });

      const result = await submitQuizAttempt('user1', 4, 5);

      expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ score: 4, passed: true }),
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'CONTRIBUTOR' },
      });
      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'user1', roleId: 2 },
      });

      expect(result.success).toBe(true);
      if ('passed' in result) {
        expect(result.passed).toBe(true);
      }
    });
  });
});
