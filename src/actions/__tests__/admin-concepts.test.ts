import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminConcepts,
  createAdminConcept,
  updateAdminConcept,
  deleteAdminConcept,
} from '../admin-concepts';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    concept: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  default: {
    concept: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/server-auth', () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from '@/lib/auth/server-auth';

describe('admin-concepts actions', () => {
  const mockUser = { id: 'user-1', email: 'admin@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as any).mockResolvedValue({ user: mockUser });
  });

  describe('getAdminConcepts', () => {
    it('should return concepts successfully', async () => {
      const mockConcepts = [{ id: 1, gloss: 'test', _count: { terms: 0 } }];
      (prisma.concept.findMany as any).mockResolvedValue(mockConcepts);
      (prisma.concept.count as any).mockResolvedValue(1);

      const result = await getAdminConcepts({});

      expect(result.success).toBe(true);
      expect(result.concepts).toEqual(mockConcepts);
      expect(result.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (prisma.concept.findMany as any).mockResolvedValue([]);
      (prisma.concept.count as any).mockResolvedValue(0);

      await getAdminConcepts({ search: 'test' });

      expect(prisma.concept.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gloss: { contains: 'test', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should return error on failure', async () => {
      (requireAuth as any).mockRejectedValue(new Error('Unauthorized'));

      const result = await getAdminConcepts({});

      expect(result.success).toBe(false);
    });
  });

  describe('createAdminConcept', () => {
    it('should create concept successfully', async () => {
      (prisma.concept.findFirst as any).mockResolvedValue(null);
      (prisma.concept.create as any).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append('gloss', 'new concept');

      const result = await createAdminConcept(formData);

      expect(result.success).toBe(true);
      expect(prisma.concept.create).toHaveBeenCalledWith({
        data: { gloss: 'new concept' },
      });
    });

    it('should return validation error for empty gloss', async () => {
      const formData = new FormData();
      formData.append('gloss', '');

      const result = await createAdminConcept(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should return error if concept already exists', async () => {
      (prisma.concept.findFirst as any).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append('gloss', 'existing concept');

      const result = await createAdminConcept(formData);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        gloss: ['A concept with this gloss already exists.'],
      });
    });
  });

  describe('updateAdminConcept', () => {
    it('should update concept successfully', async () => {
      (prisma.concept.findFirst as any).mockResolvedValue(null);
      (prisma.concept.update as any).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append('gloss', 'updated gloss');

      const result = await updateAdminConcept(1, formData);

      expect(result.success).toBe(true);
      expect(prisma.concept.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { gloss: 'updated gloss' },
      });
    });

    it('should check for duplicates excluding current concept', async () => {
      (prisma.concept.findFirst as any).mockResolvedValue({ id: 2 });

      const formData = new FormData();
      formData.append('gloss', 'existing gloss');

      const result = await updateAdminConcept(1, formData);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        gloss: ['Another concept with this gloss already exists.'],
      });
    });
  });

  describe('deleteAdminConcept', () => {
    it('should delete concept successfully', async () => {
      (prisma.concept.findUnique as any).mockResolvedValue({
        id: 1,
        _count: { terms: 0 },
      });
      (prisma.concept.delete as any).mockResolvedValue({});

      const result = await deleteAdminConcept(1);

      expect(result.success).toBe(true);
      expect(prisma.concept.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return error if concept not found', async () => {
      (prisma.concept.findUnique as any).mockResolvedValue(null);

      const result = await deleteAdminConcept(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Concept not found');
    });

    it('should prevent deletion if terms are attached', async () => {
      (prisma.concept.findUnique as any).mockResolvedValue({
        id: 1,
        _count: { terms: 3 },
      });

      const result = await deleteAdminConcept(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Cannot delete concept because it has 3 term(s) attached'
      );
      expect(prisma.concept.delete).not.toHaveBeenCalled();
    });

    it('should return error on database failure', async () => {
      (prisma.concept.findUnique as any).mockResolvedValue({
        id: 1,
        _count: { terms: 0 },
      });
      (prisma.concept.delete as any).mockRejectedValue(new Error('DB error'));

      const result = await deleteAdminConcept(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete concept');
    });
  });
});
