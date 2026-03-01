import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  curateNeo,
  getTerms,
  getTermNeos,
  getNeosRatedByMe,
  rateNeo,
} from '../curateNeo';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    neo: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    neoRating: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    vote: {
      findMany: vi.fn(),
    },
    term: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  default: {
    neo: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    neoRating: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    vote: {
      findMany: vi.fn(),
    },
    term: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('curateNeo actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.neoRating.findMany as any).mockResolvedValue([]);
    (prisma.vote.findMany as any).mockResolvedValue([]);
  });

  describe('curateNeo', () => {
    it('should return success with no suggestions processed', async () => {
      const formData = new FormData();
      formData.append('userId', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('termId', '1');

      const result = await curateNeo({ message: '', success: false }, formData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Neos curated successfully!');
      expect(prisma.neo.create).not.toHaveBeenCalled();
    });

    it('should create neos successfully with valid suggestions', async () => {
      const formData = new FormData();
      formData.append('userId', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('termId', '1');
      formData.append('suggestions[0].type', 'CREATIVE');
      formData.append('suggestions[0].text', 'new-word');
      (prisma.neo.create as any).mockResolvedValue({ id: 1 });

      const result = await curateNeo({ message: '', success: false }, formData);
      console.log(
        'Result for curateNeo valid suggestions:',
        JSON.stringify(result.failedSuggestions, null, 2)
      );

      expect(result.success).toBe(true);
      expect(prisma.neo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          text: 'new-word',
          type: 'CREATIVE',
        }),
      });
    });

    it('should handle validation errors for invalid suggestions', async () => {
      const formData = new FormData();
      formData.append('userId', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('termId', '1');
      formData.append('suggestions[0].type', 'INVALID_TYPE');
      formData.append('suggestions[0].text', '');

      const result = await curateNeo({ message: '', success: false }, formData);

      expect(result.success).toBe(false);
      expect(result.failedSuggestions).toBeDefined();
      expect(result.failedSuggestions?.[0]).toHaveProperty('errors');
    });

    it('should handle database errors gracefully', async () => {
      const formData = new FormData();
      formData.append('userId', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('termId', '1');
      formData.append('suggestions[0].type', 'CREATIVE');
      formData.append('suggestions[0].text', 'new-word');
      (prisma.neo.create as any).mockRejectedValue(new Error('DB error'));

      const result = await curateNeo({ message: '', success: false }, formData);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'An error occurred while saving your suggestions. Please try again.'
      );
    });

    it('should process multiple suggestions', async () => {
      const formData = new FormData();
      formData.append('userId', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('termId', '1');
      formData.append('suggestions[0].type', 'CREATIVE');
      formData.append('suggestions[0].text', 'word1');
      formData.append('suggestions[1].type', 'POPULAR');
      formData.append('suggestions[1].text', 'word2');
      (prisma.neo.create as any).mockResolvedValue({ id: 1 });

      const result = await curateNeo({ message: '', success: false }, formData);

      expect(prisma.neo.create).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });
  });

  describe('getTerms', () => {
    it('should return empty array on error', async () => {
      (prisma.term.findMany as any).mockRejectedValue(new Error('DB error'));

      const result = await getTerms(1);

      expect(result).toEqual([]);
    });

    it('should return terms with neo count for authenticated user', async () => {
      (prisma.term.findMany as any).mockResolvedValue([
        {
          id: 1,
          text: 'test',
          meaning: 'test meaning',
          phonics: '/test/',
          languageId: 1,
          partOfSpeechId: 1,
          conceptId: 1,
          voteScore: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          concept: { gloss: 'test gloss' },
          partOfSpeech: { name: 'noun' },
          _count: { neos: 2 },
        },
      ]);

      const result = await getTerms(1, 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('test');
      expect(result[0]._count.neos).toBe(2);
    });

    it('should return all terms when userId is not provided', async () => {
      (prisma.neo.groupBy as any).mockResolvedValue([
        { termId: 1 },
        { termId: 2 },
      ]);
      (prisma.term.findMany as any).mockResolvedValue([]);

      await getTerms(1);

      expect(prisma.neo.groupBy).toHaveBeenCalled();
      expect(prisma.term.findMany).toHaveBeenCalled();
    });
  });

  describe('getTermNeos', () => {
    it('should return null on error', async () => {
      (prisma.neo.findMany as any).mockRejectedValue(new Error('DB error'));

      const result = await getTermNeos(1);

      expect(result).toBeNull();
    });

    it('should return filtered and sorted neos', async () => {
      (prisma.neo.findMany as any).mockResolvedValue([
        {
          id: 1,
          ratingCount: 5,
          rejectCount: 0,
          ratingScore: 4.5,
          votes: [{ value: 5 }],
          userId: 'other',
          termId: 1,
          text: 'neo1',
          type: 'CREATIVE',
          audioUrl: null,
        },
        {
          id: 2,
          ratingCount: 3,
          rejectCount: 0,
          ratingScore: 3.0,
          votes: [{ value: 3 }],
          userId: 'other',
          termId: 1,
          text: 'neo2',
          type: 'POPULAR',
          audioUrl: null,
        },
      ]);

      const result = await getTermNeos(1, true, 'user-1');

      expect(result).toHaveLength(2);
      expect(result![0].vote).toBe(5);
    });

    it('should filter out already rated neos for user', async () => {
      (prisma.neo.findMany as any).mockResolvedValue([
        {
          id: 1,
          ratingCount: 5,
          rejectCount: 0,
          ratingScore: 4.5,
          votes: [],
          userId: 'other',
          termId: 1,
          text: 'neo1',
          type: 'CREATIVE',
          audioUrl: null,
        },
      ]);
      (prisma.neoRating.findMany as any).mockResolvedValue([
        { neoId: 1, value: 5 },
      ]);

      const result = await getTermNeos(1, true, 'user-1');

      expect(result).toHaveLength(0);
    });

    it('should handle unrated neos filter when getRated is false', async () => {
      (prisma.neo.findMany as any).mockResolvedValue([
        {
          id: 1,
          ratingCount: 0,
          rejectCount: 0,
          ratingScore: 0,
          votes: [],
          userId: 'other',
          termId: 1,
          text: 'neo1',
          type: 'CREATIVE',
          audioUrl: null,
        },
        {
          id: 2,
          ratingCount: 0,
          rejectCount: 3,
          ratingScore: 0,
          votes: [],
          userId: 'other',
          termId: 1,
          text: 'neo2',
          type: 'CREATIVE',
          audioUrl: null,
        },
      ]);

      const result = await getTermNeos(1, false, 'user-1');

      expect(result).toHaveLength(1);
      expect(result![0].id).toBe(1);
    });
  });

  describe('getNeosRatedByMe', () => {
    it('should return empty array on error', async () => {
      (prisma.neoRating.findMany as any).mockRejectedValue(
        new Error('DB error')
      );

      const result = await getNeosRatedByMe('user-1');

      expect(result).toEqual([]);
    });

    it('should return rated neos for user', async () => {
      (prisma.neoRating.findMany as any).mockResolvedValue([
        { neoId: 1, value: 5 },
        { neoId: 2, value: 3 },
      ]);

      const result = await getNeosRatedByMe('user-1', [1, 2]);

      expect(result).toEqual([
        { neoId: 1, value: 5 },
        { neoId: 2, value: 3 },
      ]);
    });
  });

  describe('rateNeo', () => {
    it('should return null on error', async () => {
      (prisma.$transaction as any).mockRejectedValue(new Error('DB error'));

      const result = await rateNeo(1, 'user-1', 5, null);

      expect(result).toBeNull();
    });

    it('should successfully rate a neo', async () => {
      const mockTx = {
        neoRating: {
          upsert: vi
            .fn()
            .mockResolvedValue({ id: 1, neoId: 1, userId: 'user-1', value: 5 }),
          groupBy: vi
            .fn()
            .mockResolvedValue([
              { _count: { _all: 1, rejectionReason: 0 }, _sum: { value: 5 } },
            ]),
        },
        neo: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );
      (prisma.neoRating.findMany as any).mockResolvedValue([
        { neoId: 1, value: 5 },
      ]);

      const result = await rateNeo(1, 'user-1', 5, null);

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Neo rated successfully');
    });

    it('should handle rejection with reason', async () => {
      const mockTx = {
        neoRating: {
          upsert: vi.fn().mockResolvedValue({
            id: 1,
            neoId: 1,
            userId: 'user-1',
            value: -1,
            rejectionReason: 'Not appropriate',
          }),
          groupBy: vi
            .fn()
            .mockResolvedValue([
              { _count: { _all: 1, rejectionReason: 1 }, _sum: { value: -1 } },
            ]),
        },
        neo: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );
      (prisma.neoRating.findMany as any).mockResolvedValue([
        { neoId: 1, value: -1 },
      ]);

      const result = await rateNeo(1, 'user-1', -1, 'Not appropriate');

      expect(result?.success).toBe(true);
    });

    it('should update neo rating stats correctly', async () => {
      const mockTx = {
        neoRating: {
          upsert: vi.fn().mockResolvedValue({}),
          groupBy: vi
            .fn()
            .mockResolvedValue([
              { _count: { _all: 4, rejectionReason: 1 }, _sum: { value: 15 } },
            ]),
        },
        neo: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) =>
        cb(mockTx)
      );
      (prisma.neoRating.findMany as any).mockResolvedValue([]);

      await rateNeo(1, 'user-1', 5, null);

      expect(mockTx.neo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ratingCount: 4,
          ratingScore: 3.75,
          rejectCount: 1,
        },
      });
    });
  });
});
