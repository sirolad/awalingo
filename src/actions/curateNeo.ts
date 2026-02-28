'use server';

import { prisma } from '@/lib/prisma';
import { curateNeoSchema, CurateNeoState } from '@/lib/schemas/curate';
import { Neo, RatedByMe, RateNeo, TermWithNeoCount } from '@/types';

export async function curateNeo(
  prevState: CurateNeoState,
  formData: FormData
): Promise<CurateNeoState> {
  let hasError = false;
  const failedSuggestions = [];
  for (let i = 0; i < 5; i++) {
    if (!formData.get(`suggestions[${i}]`)) {
      continue;
    }
    const validatedFields = curateNeoSchema.safeParse({
      userId: formData.get('userId'),
      termId: formData.get('termId'),
      type: formData.get(`suggestions[${i}].type`),
      text: formData.get(`suggestions[${i}].text`),
      audioUrl: formData.get(`suggestions[${i}].audioUrl`),
    });

    if (!validatedFields.success) {
      hasError = true;
      failedSuggestions.push({
        index: i,
        errors: validatedFields.error.flatten().fieldErrors,
      });
      continue;
    }

    const { userId, termId, type, text, audioUrl } = validatedFields.data;

    try {
      await prisma.neo.create({
        data: {
          userId,
          termId,
          text,
          type,
          audioUrl,
        },
      });
    } catch (error) {
      console.warn(`Failed to curate Neo for suggestion ${i}:`, error);
      return {
        success: false,
        message:
          'An error occurred while saving your suggestions. Please try again.',
      };
    }
  }

  if (hasError) {
    return {
      success: false,
      message:
        'Some suggestions failed to curate. Please check the errors and try again.',
      failedSuggestions,
    };
  }

  return {
    success: true,
    message: 'Neos curated successfully!',
  };
}

export async function getTerms(
  userCommunityId: number,
  userId?: string
): Promise<TermWithNeoCount[]> {
  try {
    let termIds: number[] = [];
    if (!userId) {
      const matches = await prisma.neo.groupBy({
        by: ['termId'],
        where: {
          userId: userId,
        },
        having: {
          termId: {
            _count: {
              lt: 5,
            },
          },
        },
      });
      termIds = matches.map(m => m.termId);
    }

    return await prisma.term.findMany({
      where: {
        languageId: userCommunityId,
        id: { in: termIds.length > 0 ? termIds : undefined },
      },
      select: {
        id: true,
        text: true,
        meaning: true,
        phonics: true,
        languageId: true,
        partOfSpeechId: true,
        conceptId: true,
        voteScore: true,
        createdAt: true,
        updatedAt: true,
        concept: {
          select: {
            gloss: true,
          },
        },
        partOfSpeech: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            neos: {
              where: {
                userId: userId,
              },
            },
          },
        },
      },
      orderBy: { text: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch term:', error);
    return [];
  }
}

export const getTermNeos: Neo = async (termId, getRated = true, userId) => {
  try {
    const neos = await prisma.neo.findMany({
      where: { termId },
      select: {
        id: true,
        userId: true,
        termId: true,
        text: true,
        type: true,
        audioUrl: true,
        ratingCount: true,
        ratingScore: true,
        rejectCount: true,
        votes: {
          select: {
            value: true,
          },
        },
      },
    });
    let byMe: { neoId: number; value: number }[] = [];
    if (userId) {
      byMe = getRated
        ? await getNeosRatedByMe(
            userId,
            neos.map(n => n.id)
          )
        : await prisma.vote.findMany({
            where: {
              userId,
              neoId: { in: neos.map(n => n.id) },
              value: {
                not: 0,
              },
            },
            select: {
              neoId: true,
              value: true,
            },
          });
    }

    return neos
      .filter(
        neo =>
          byMe.find(r => r.neoId === neo.id)?.value === undefined &&
          (getRated
            ? neo.ratingCount > 0 && neo.rejectCount == 0
            : neo.ratingCount === 0 && neo.rejectCount < 3)
      )
      .map(neo => ({
        ...neo,
        vote: neo.votes.reduce((acc, curr) => acc + curr.value, 0),
      }))
      .sort((a, b) =>
        getRated ? b.ratingScore - a.ratingScore : b.ratingCount - a.ratingCount
      )
      .slice(0, 11);
  } catch (error) {
    console.error('Failed to fetch neos for term:', error);
    return null;
  }
};

export const getNeosRatedByMe: RatedByMe = async (userId, neoIds) => {
  try {
    const ratedByMe = await prisma.neoRating.findMany({
      where: { userId, neoId: neoIds ? { in: neoIds } : undefined },
      include: { ratedBy: true },
    });
    return ratedByMe.map(({ neoId, value }) => ({
      neoId,
      value,
    }));
  } catch (error) {
    console.error('Failed to fetch neos rated by user:', error);
    return [];
  }
};

export const rateNeo: RateNeo = async (
  neoId,
  userId,
  rating,
  rejectionReason = null
) => {
  try {
    await prisma.$transaction(async tx => {
      const neoRating = await tx.neoRating.upsert({
        where: { userId_neoId: { userId, neoId } },
        create: {
          neoId,
          userId,
          value: rating,
          rejectionReason,
        },
        update: {
          value: rating,
          rejectionReason,
        },
      });
      console.log('Neo rating upserted:', neoRating);
      if (!neoRating) {
        throw new Error('Failed to save rating');
      }
      const result = await tx.neoRating.groupBy({
        by: ['neoId'],
        where: { neoId },
        _count: {
          _all: true,
          rejectionReason: true,
        },
        _sum: { value: true },
      });

      const ratingCount = result[0]?._count?._all ?? 0;
      const ratingSum = result[0]?._sum?.value ?? 0;
      const rejectCount = result[0]?._count?.rejectionReason ?? 0;

      const ratingScore = ratingCount > 0 ? ratingSum / ratingCount : 0;
      await tx.neo.update({
        where: { id: neoId },
        data: {
          ratingCount: ratingCount,
          ratingScore: ratingScore,
          rejectCount: rejectCount,
        },
      });
    });
    const ratedByMe = await getNeosRatedByMe(userId);
    return {
      success: true,
      message: 'Neo rated successfully',
      data: ratedByMe,
    };
  } catch (error) {
    console.error('Failed to rate neo:', error);
    return null;
  }
};
