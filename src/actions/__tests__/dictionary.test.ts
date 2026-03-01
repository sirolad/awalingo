import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  submitRequest,
  getDictionaryTerms,
  getUserProfileForRequest,
} from '../dictionary';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    translationRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    term: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    domain: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
    },
  },
  default: {
    translationRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    term: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    domain: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/server-auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import { requireAuth } from '@/lib/auth/server-auth';

describe('dictionary actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitRequest', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };

    it('should return unauthorized error if user is not authenticated', async () => {
      (requireAuth as any).mockRejectedValue(new Error('Unauthorized'));

      const formData = new FormData();
      formData.append('word', 'test');
      formData.append('meaning', 'test meaning');
      formData.append('sourceLanguageId', '1');
      formData.append('targetLanguageId', '2');
      formData.append('partOfSpeechId', '1');

      const result = await submitRequest(
        { message: '', success: false },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Unauthorized: Please sign in to submit a request'
      );
    });

    it('should return validation errors if fields are missing', async () => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });

      const formData = new FormData();
      formData.append('word', '');

      const result = await submitRequest(
        { message: '', success: false },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.message).toBe('Missing Fields. Failed to submit request.');
    });

    it('should return error if duplicate request exists', async () => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
      (prisma.translationRequest.findFirst as any).mockResolvedValue({
        id: 1,
        word: 'test',
      });

      const formData = new FormData();
      formData.append('word', 'test');
      formData.append('meaning', 'test meaning');
      formData.append('sourceLanguageId', '1');
      formData.append('targetLanguageId', '2');
      formData.append('partOfSpeechId', '1');

      const result = await submitRequest(
        { message: '', success: false },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.errors?.word).toContain(
        'This word already has a pending translation request.'
      );
    });

    it('should return error if term already exists in dictionary', async () => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
      (prisma.translationRequest.findFirst as any).mockResolvedValue(null);
      (prisma.term.findFirst as any).mockResolvedValue({ id: 1, text: 'test' });

      const formData = new FormData();
      formData.append('word', 'test');
      formData.append('meaning', 'test meaning');
      formData.append('sourceLanguageId', '1');
      formData.append('targetLanguageId', '2');
      formData.append('partOfSpeechId', '1');

      const result = await submitRequest(
        { message: '', success: false },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.errors?.word).toContain(
        'This word already exists in the dictionary.'
      );
    });

    it('should successfully create request with new domains', async () => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
      (prisma.translationRequest.findFirst as any).mockResolvedValue(null);
      (prisma.term.findFirst as any).mockResolvedValue(null);
      (prisma.domain.findUnique as any).mockResolvedValue(null);
      (prisma.domain.create as any).mockResolvedValue({
        id: 1,
        name: 'Technology',
      });
      (prisma.translationRequest.create as any).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append('word', 'neologism');
      formData.append('meaning', 'a newly coined word');
      formData.append('sourceLanguageId', '1');
      formData.append('targetLanguageId', '2');
      formData.append('partOfSpeechId', '1');
      formData.append('domains', JSON.stringify(['Technology']));

      const result = await submitRequest(
        { message: '', success: false },
        formData
      );

      expect(result.success).toBe(true);
      expect(prisma.domain.create).toHaveBeenCalledWith({
        data: { name: 'Technology' },
      });
      expect(prisma.translationRequest.create).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/dictionary');
    });

    it('should successfully create request with existing domain', async () => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
      (prisma.translationRequest.findFirst as any).mockResolvedValue(null);
      (prisma.term.findFirst as any).mockResolvedValue(null);
      (prisma.domain.findUnique as any).mockResolvedValue({
        id: 2,
        name: 'Science',
      });

      const formData = new FormData();
      formData.append('word', 'quantum');
      formData.append('meaning', 'smallest unit of energy');
      formData.append('sourceLanguageId', '1');
      formData.append('targetLanguageId', '2');
      formData.append('partOfSpeechId', '1');
      formData.append('domains', JSON.stringify(['Science']));

      const result = await submitRequest(
        { message: '', success: false },
        formData
      );

      expect(result.success).toBe(true);
      expect(prisma.domain.create).not.toHaveBeenCalled();
    });

    it('should handle stringified domains array', async () => {
      (requireAuth as any).mockResolvedValue({ user: mockUser });
      (prisma.translationRequest.findFirst as any).mockResolvedValue(null);
      (prisma.term.findFirst as any).mockResolvedValue(null);
      (prisma.domain.findUnique as any).mockResolvedValue({
        id: 1,
        name: 'Tech',
      });

      const formData = new FormData();
      formData.append('word', 'ai');
      formData.append('meaning', 'artificial intelligence');
      formData.append('sourceLanguageId', '1');
      formData.append('targetLanguageId', '2');
      formData.append('partOfSpeechId', '1');
      formData.append('domains', '["Tech", "Computing"]');

      await submitRequest({ message: '', success: false }, formData);

      expect(prisma.domain.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDictionaryTerms', () => {
    it('should return empty array if no terms found', async () => {
      (prisma.term.findMany as any).mockResolvedValue([]);

      const result = await getDictionaryTerms(1, 2);

      expect(result).toEqual([]);
      expect(prisma.term.findMany).toHaveBeenCalledWith({
        where: { languageId: 1 },
        orderBy: { text: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should return terms with translations', async () => {
      (prisma.term.findMany as any).mockResolvedValue([
        {
          id: 1,
          text: 'hello',
          meaning: 'greeting',
          phonics: '/həˈloʊ/',
          partOfSpeech: { name: 'noun' },
          domains: [{ domain: { name: 'General' } }],
          concept: {
            terms: [{ text: 'hola' }],
          },
        },
      ]);

      const result = await getDictionaryTerms(1, 2);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        text: 'hello',
        meaning: 'greeting',
        phonics: '/həˈloʊ/',
        partOfSpeech: 'noun',
        domains: ['General'],
        translation: 'hola',
      });
    });

    it('should return null translation when no sibling term exists', async () => {
      (prisma.term.findMany as any).mockResolvedValue([
        {
          id: 2,
          text: 'test',
          meaning: 'a test',
          phonics: null,
          partOfSpeech: { name: 'noun' },
          domains: [],
          concept: { terms: [] },
        },
      ]);

      const result = await getDictionaryTerms(1, 2);

      expect(result[0].translation).toBeNull();
    });
  });

  describe('getUserProfileForRequest', () => {
    it('should return user profile with languages', async () => {
      const mockProfile = {
        userId: 'user-1',
        uiLanguage: { id: 1, name: 'English' },
        targetLanguages: [{ language: { id: 2, name: 'Spanish' } }],
      };
      (prisma.userProfile.findUnique as any).mockResolvedValue(mockProfile);

      const result = await getUserProfileForRequest('user-1');

      expect(result).toEqual(mockProfile);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          uiLanguage: true,
          targetLanguages: { include: { language: true } },
        },
      });
    });

    it('should return null on error', async () => {
      (prisma.userProfile.findUnique as any).mockRejectedValue(
        new Error('DB error')
      );

      const result = await getUserProfileForRequest('user-1');

      expect(result).toBeNull();
    });
  });
});
