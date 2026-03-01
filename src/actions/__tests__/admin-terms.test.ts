import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminTerms,
  createAdminTerm,
  updateAdminTerm,
  deleteAdminTerm,
  bulkAddAdminTerms,
  getTotalAdminTermCount,
} from '../admin-terms';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    term: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    concept: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    domain: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    domainsOnTerms: {
      deleteMany: vi.fn(),
    },
    partOfSpeech: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  default: {
    term: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    concept: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    domain: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    domainsOnTerms: {
      deleteMany: vi.fn(),
    },
    partOfSpeech: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/server-auth', () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from '@/lib/auth/server-auth';

describe('admin-terms actions', () => {
  const mockUser = { id: 'user-1', email: 'admin@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as any).mockResolvedValue({ user: mockUser });
  });

  describe('getAdminTerms', () => {
    it('should return terms successfully', async () => {
      const mockTerms = [{ id: 1, text: 'test', meaning: 'test meaning' }];
      (prisma.term.findMany as any).mockResolvedValue(mockTerms);
      (prisma.term.count as any).mockResolvedValue(1);

      const result = await getAdminTerms({});

      expect(result.success).toBe(true);
      expect(result.terms).toEqual(mockTerms);
      expect(result.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (prisma.term.findMany as any).mockResolvedValue([]);
      (prisma.term.count as any).mockResolvedValue(0);

      await getAdminTerms({ search: 'hello' });

      expect(prisma.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                text: { contains: 'hello', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      );
    });

    it('should apply language filter', async () => {
      (prisma.term.findMany as any).mockResolvedValue([]);
      (prisma.term.count as any).mockResolvedValue(0);

      await getAdminTerms({ languageId: 1 });

      expect(prisma.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ languageId: 1 }),
        })
      );
    });

    it('should return error on failure', async () => {
      (requireAuth as any).mockRejectedValue(new Error('Unauthorized'));

      const result = await getAdminTerms({});

      expect(result.success).toBe(false);
    });
  });

  describe('createAdminTerm', () => {
    it('should create term successfully', async () => {
      (prisma.term.findFirst as any).mockResolvedValue(null);
      const mockTx = {
        concept: { create: vi.fn().mockResolvedValue({ id: 1 }) },
        domain: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        term: { create: vi.fn().mockResolvedValue({}) },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );

      const formData = new FormData();
      formData.append('text', 'test');
      formData.append('meaning', 'test meaning');
      formData.append('languageId', '1');
      formData.append('partOfSpeechId', '1');

      const result = await createAdminTerm(formData);

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/dictionary-terms');
    });

    it('should return validation errors for invalid data', async () => {
      const formData = new FormData();
      formData.append('text', '');
      formData.append('meaning', '');
      formData.append('languageId', '1');
      formData.append('partOfSpeechId', '1');

      const result = await createAdminTerm(formData);

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('object');
    });

    it('should return error if term already exists', async () => {
      (prisma.term.findFirst as any).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append('text', 'existing');
      formData.append('meaning', 'existing meaning');
      formData.append('languageId', '1');
      formData.append('partOfSpeechId', '1');

      const result = await createAdminTerm(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should parse stringified domains', async () => {
      (prisma.term.findFirst as any).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append('text', 'existing');
      formData.append('meaning', 'existing meaning');
      formData.append('languageId', '1');
      formData.append('partOfSpeechId', '1');

      const result = await createAdminTerm(formData);

      expect(result.success).toBe(false);
      const errorObj = result.error as { text?: string[] } | undefined;
      expect(errorObj?.text?.[0]).toContain(
        'Term with this text and meaning already exists'
      );
    });

    it('should parse stringified domains', async () => {
      (prisma.term.findFirst as any).mockResolvedValue(null);
      const mockTx = {
        concept: { create: vi.fn().mockResolvedValue({ id: 1 }) },
        domain: { findUnique: vi.fn().mockResolvedValue({ id: 1 }) },
        term: { create: vi.fn().mockResolvedValue({}) },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );

      const formData = new FormData();
      formData.append('text', 'test');
      formData.append('meaning', 'test meaning');
      formData.append('languageId', '1');
      formData.append('partOfSpeechId', '1');
      formData.append('domains', '["Tech", "Science"]');

      const result = await createAdminTerm(formData);
      console.log('Result for createAdminTerm domains:', result);
      expect(mockTx.domain.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateAdminTerm', () => {
    it('should update term successfully', async () => {
      (prisma.term.findFirst as any).mockResolvedValue(null);
      const mockTx = {
        domain: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
          create: vi.fn().mockResolvedValue({ id: 2 }),
        },
        domainsOnTerms: { deleteMany: vi.fn().mockResolvedValue({}) },
        concept: { create: vi.fn().mockResolvedValue({ id: 1 }) },
        term: { update: vi.fn().mockResolvedValue({}) },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );

      const formData = new FormData();
      formData.append('text', 'updated');
      formData.append('meaning', 'updated meaning');
      formData.append('languageId', '1');
      formData.append('partOfSpeechId', '1');

      const result = await updateAdminTerm(1, formData);

      expect(result.success).toBe(true);
    });

    it('should check for duplicates excluding current term', async () => {
      (prisma.term.findFirst as any).mockResolvedValue({ id: 2 });

      const formData = new FormData();
      formData.append('text', 'test');
      formData.append('meaning', 'test meaning');
      formData.append('languageId', '1');
      formData.append('partOfSpeechId', '1');

      const result = await updateAdminTerm(1, formData);

      expect(result.success).toBe(false);
      const errorObj = result.error as { text?: string[] } | undefined;
      expect(errorObj?.text?.[0]).toContain(
        'Another term with this text and meaning already exists'
      );
    });
  });

  describe('deleteAdminTerm', () => {
    it('should delete term successfully', async () => {
      (prisma.term.delete as any).mockResolvedValue({});

      const result = await deleteAdminTerm(1);

      expect(result.success).toBe(true);
      expect(prisma.term.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return error on failure', async () => {
      (prisma.term.delete as any).mockRejectedValue(new Error('DB error'));

      const result = await deleteAdminTerm(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete term');
    });
  });

  describe('bulkAddAdminTerms', () => {
    it('should bulk add terms successfully', async () => {
      (prisma.partOfSpeech.findMany as any).mockResolvedValue([
        { id: 1, name: 'noun' },
      ]);
      const mockTx = {
        concept: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        domain: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        term: { create: vi.fn().mockResolvedValue({}) },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );

      const result = await bulkAddAdminTerms([
        {
          text: 'hello',
          meaning: 'greeting',
          partOfSpeech: 'noun',
          languageId: 1,
        },
      ]);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it('should return error for unknown part of speech', async () => {
      (prisma.partOfSpeech.findMany as any).mockResolvedValue([
        { id: 1, name: 'noun' },
      ]);

      const result = await bulkAddAdminTerms([
        {
          text: 'test',
          meaning: 'test',
          partOfSpeech: 'unknown-pos',
          languageId: 1,
        },
      ]);

      expect(result.success).toBe(true);
      expect(result.errors).toContain(
        'Row "test": Unknown part of speech "unknown-pos"'
      );
    });

    it('should handle existing term errors', async () => {
      (prisma.partOfSpeech.findMany as any).mockResolvedValue([
        { id: 1, name: 'noun' },
      ]);
      const mockTx = {
        concept: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        domain: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        term: { create: vi.fn().mockRejectedValue({ code: 'P2002' }) },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );

      const result = await bulkAddAdminTerms([
        {
          text: 'existing',
          meaning: 'exists',
          partOfSpeech: 'noun',
          languageId: 1,
        },
      ]);
      console.log('Result for bulkAddAdminTerms:', result);
      expect(result.errors).toContain(
        'Row "existing": Already exists in the database.'
      );
    });
  });

  describe('getTotalAdminTermCount', () => {
    it('should return total count', async () => {
      (prisma.term.count as any).mockResolvedValue(100);

      const result = await getTotalAdminTermCount();

      expect(result.success).toBe(true);
      expect(result.count).toBe(100);
    });

    it('should return 0 on error', async () => {
      (prisma.term.count as any).mockRejectedValue(new Error('DB error'));

      const result = await getTotalAdminTermCount();

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });
  });
});
