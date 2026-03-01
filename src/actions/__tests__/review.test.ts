import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPendingRequests,
  getAllRequests,
  getPendingReviewsCount,
  reviewRequest,
  updateRequest,
  deleteRequest,
} from '../review';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    translationRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    concept: {
      create: vi.fn(),
    },
    term: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  default: {
    translationRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    concept: {
      create: vi.fn(),
    },
    term: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/server-auth', () => ({
  requireAuth: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/decorators', () => ({
  Authorized:
    () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) =>
      descriptor,
}));

import { requireAuth } from '@/lib/auth/server-auth';
import { logAudit } from '@/lib/audit';

describe('review actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingRequests', () => {
    it('should return pending requests successfully', async () => {
      const mockRequests = [
        {
          id: 1,
          word: 'test',
          meaning: 'test meaning',
          user: {},
          sourceLanguage: {},
          targetLanguage: {},
          partOfSpeech: {},
        },
      ];
      (prisma.translationRequest.findMany as any).mockResolvedValue(
        mockRequests
      );

      const result = await getPendingRequests();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRequests);
    });

    it('should return error on failure', async () => {
      (prisma.translationRequest.findMany as any).mockRejectedValue(
        new Error('DB error')
      );

      const result = await getPendingRequests();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch requests');
    });

    it('should respect limit and offset', async () => {
      (prisma.translationRequest.findMany as any).mockResolvedValue([]);

      await getPendingRequests(5, 10);

      expect(prisma.translationRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 10 })
      );
    });
  });

  describe('getAllRequests', () => {
    it('should return all requests successfully', async () => {
      const mockRequests = [
        { id: 1, word: 'test', user: {}, sourceLanguage: {} },
      ];
      (prisma.translationRequest.findMany as any).mockResolvedValue(
        mockRequests
      );

      const result = await getAllRequests();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRequests);
    });

    it('should return error on failure', async () => {
      (prisma.translationRequest.findMany as any).mockRejectedValue(
        new Error('DB error')
      );

      const result = await getAllRequests();

      expect(result.success).toBe(false);
    });
  });

  describe('getPendingReviewsCount', () => {
    it('should return count of pending reviews', async () => {
      (prisma.translationRequest.count as any).mockResolvedValue(5);

      const result = await getPendingReviewsCount();

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
    });

    it('should return 0 count on error', async () => {
      (prisma.translationRequest.count as any).mockRejectedValue(
        new Error('DB error')
      );

      const result = await getPendingReviewsCount();

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('reviewRequest - APPROVED', () => {
    const mockUser = { id: 'user-1' };

    beforeEach(() => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
    });

    it('should approve request and create term in transaction', async () => {
      const mockRequest = {
        id: 1,
        word: 'test',
        meaning: 'test meaning',
        sourceLanguageId: 1,
        partOfSpeechId: 1,
        domains: [{ domainId: 1 }],
      };
      const mockTx = {
        translationRequest: {
          findUnique: vi.fn().mockResolvedValue(mockRequest),
          update: vi.fn().mockResolvedValue({}),
        },
        concept: {
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        term: {
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );

      const result = await reviewRequest(1, 'APPROVED');

      expect(result.success).toBe(true);
      expect(mockTx.concept.create).toHaveBeenCalledWith({
        data: { gloss: 'test meaning' },
      });
      expect(mockTx.term.create).toHaveBeenCalled();
      expect(mockTx.translationRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'APPROVED', reviewedById: 'user-1' },
      });
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review:request:approved' })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/admin/requests');
    });

    it('should handle request not found', async () => {
      const mockTx = {
        translationRequest: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        concept: { create: vi.fn() },
        term: { create: vi.fn() },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );

      const result = await reviewRequest(999, 'APPROVED');

      expect(result.success).toBe(false);
    });
  });

  describe('reviewRequest - REJECTED', () => {
    const mockUser = { id: 'user-1' };

    beforeEach(() => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
    });

    it('should reject request with reason', async () => {
      (prisma.translationRequest.update as any).mockResolvedValue({});

      const result = await reviewRequest(1, 'REJECTED', 'Not appropriate');

      expect(result.success).toBe(true);
      expect(prisma.translationRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Not appropriate',
          reviewedById: 'user-1',
        },
      });
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'review:request:rejected',
          metadata: { reason: 'Not appropriate' },
        })
      );
    });

    it('should reject without reason', async () => {
      (prisma.translationRequest.update as any).mockResolvedValue({});

      const result = await reviewRequest(1, 'REJECTED');

      expect(result.success).toBe(true);
      expect(prisma.translationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rejectionReason: undefined }),
        })
      );
    });
  });

  describe('updateRequest', () => {
    const mockUser = { id: 'user-1' };

    beforeEach(() => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
    });

    it('should update request successfully', async () => {
      (prisma.translationRequest.update as any).mockResolvedValue({});

      const result = await updateRequest(1, {
        word: 'updated-word',
        meaning: 'updated meaning',
        partOfSpeechId: 2,
      });

      expect(result.success).toBe(true);
      expect(prisma.translationRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          word: 'updated-word',
          meaning: 'updated meaning',
          partOfSpeechId: 2,
        },
      });
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review:request:edited' })
      );
    });

    it('should return error on failure', async () => {
      (prisma.translationRequest.update as any).mockRejectedValue(
        new Error('DB error')
      );

      const result = await updateRequest(1, {
        word: 'test',
        meaning: 'test',
        partOfSpeechId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update request');
    });
  });

  describe('deleteRequest', () => {
    const mockUser = { id: 'user-1' };

    beforeEach(() => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
    });

    it('should delete request successfully', async () => {
      (prisma.translationRequest.delete as any).mockResolvedValue({});

      const result = await deleteRequest(1);

      expect(result.success).toBe(true);
      expect(prisma.translationRequest.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review:request:deleted' })
      );
    });

    it('should return error on failure', async () => {
      (prisma.translationRequest.delete as any).mockRejectedValue(
        new Error('DB error')
      );

      const result = await deleteRequest(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete request');
    });
  });
});
