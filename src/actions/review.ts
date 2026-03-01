'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server-auth';
import { logAudit } from '@/lib/audit';
import { Authorized } from '@/lib/auth/decorators';
import { Prisma } from '@/generated/prisma';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export async function getPendingRequests(limit = 10, offset = 0) {
  try {
    const requests = await prisma.translationRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: true,
        sourceLanguage: true,
        targetLanguage: true,
        partOfSpeech: true,
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, data: requests };
  } catch (error) {
    console.error('Failed to fetch pending requests:', error);
    return { success: false, error: 'Failed to fetch requests' };
  }
}

export async function getAllRequests(limit = 10, offset = 0, search?: string) {
  try {
    const whereClause: Prisma.TranslationRequestWhereInput = {};
    if (search) {
      whereClause.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { meaning: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { rejectionReason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const requests = await prisma.translationRequest.findMany({
      where: whereClause,
      include: {
        user: true,
        sourceLanguage: true,
        targetLanguage: true,
        partOfSpeech: true,
        reviewedBy: true,
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, data: requests };
  } catch (error) {
    console.error('Failed to fetch all requests:', error);
    return { success: false, error: 'Failed to fetch requests' };
  }
}

export async function getPendingReviewsCount() {
  try {
    const count = await prisma.translationRequest.count({
      where: { status: 'PENDING' },
    });
    return { success: true, count };
  } catch (error) {
    console.error('Failed to fetch pending reviews count:', error);
    return { success: false, count: 0 };
  }
}

class ReviewActions {
  @Authorized('review:requests')
  static async reviewRequest(
    requestId: number,
    status: RequestStatus,
    reason?: string
  ) {
    // Permission is guaranteed by decorator
    const { user } = await requireAuth();

    try {
      if (status === 'APPROVED') {
        // Run promotion inside a transaction
        await prisma.$transaction(async tx => {
          const request = await tx.translationRequest.findUnique({
            where: { id: requestId },
            include: { domains: true },
          });

          if (!request) throw new Error('Request not found');

          // 1. Create a new Concept — gloss = meaning as language-agnostic anchor
          const concept = await tx.concept.create({
            data: { gloss: request.meaning ?? undefined },
          });

          // 2. Promote word to Term (sourceLanguageId → languageId)
          await tx.term.create({
            data: {
              text: request.word,
              languageId: request.sourceLanguageId,
              meaning: request.meaning ?? request.word, // meaning is required
              partOfSpeechId: request.partOfSpeechId,
              conceptId: concept.id,
              domains: {
                create: request.domains.map(d => ({
                  domain: { connect: { id: d.domainId } },
                })),
              },
            },
          });

          // 3. Keep the request for history — mark as APPROVED and track reviewer
          await tx.translationRequest.update({
            where: { id: requestId },
            data: {
              status: 'APPROVED',
              reviewedById: user.id,
            },
          });
        });

        await logAudit({
          userId: user.id,
          action: 'review:request:approved',
          resourceId: requestId.toString(),
          metadata: {},
        });
      } else {
        // REJECTED — keep the record, update status and reason
        await prisma.translationRequest.update({
          where: { id: requestId },
          data: {
            status,
            rejectionReason: reason,
            reviewedById: user.id,
          },
        });

        await logAudit({
          userId: user.id,
          action: 'review:request:rejected',
          resourceId: requestId.toString(),
          metadata: { reason },
        });
      }

      revalidatePath('/admin/requests');
      revalidatePath('/curator/requests');
      revalidatePath('/home');
      revalidatePath('/dictionary');
      return { success: true };
    } catch (error) {
      console.error('Failed to review request:', error);
      return { success: false, error: 'Failed to update request status' };
    }
  }
}

class EditActions {
  @Authorized('review:requests')
  static async updateRequest(
    requestId: number,
    data: { word: string; meaning: string | null; partOfSpeechId: number }
  ) {
    const { user } = await requireAuth();

    try {
      await prisma.translationRequest.update({
        where: { id: requestId },
        data: {
          word: data.word,
          meaning: data.meaning,
          partOfSpeechId: data.partOfSpeechId,
        },
      });

      await logAudit({
        userId: user.id,
        action: 'review:request:edited',
        resourceId: requestId.toString(),
        metadata: { word: data.word, partOfSpeechId: data.partOfSpeechId },
      });

      revalidatePath('/admin/requests');
      revalidatePath('/curator/requests');
      return { success: true };
    } catch (error) {
      console.error('Failed to update request:', error);
      return { success: false, error: 'Failed to update request' };
    }
  }

  @Authorized('review:requests')
  static async deleteRequest(requestId: number) {
    const { user } = await requireAuth();

    try {
      await prisma.translationRequest.delete({
        where: { id: requestId },
      });

      await logAudit({
        userId: user.id,
        action: 'review:request:deleted',
        resourceId: requestId.toString(),
        metadata: {},
      });

      revalidatePath('/admin/requests');
      revalidatePath('/curator/requests');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete request:', error);
      return { success: false, error: 'Failed to delete request' };
    }
  }
}

export async function reviewRequest(
  requestId: number,
  status: RequestStatus,
  reason?: string
) {
  return ReviewActions.reviewRequest(requestId, status, reason);
}

export async function updateRequest(
  requestId: number,
  data: { word: string; meaning: string | null; partOfSpeechId: number }
) {
  return EditActions.updateRequest(requestId, data);
}

export async function deleteRequest(requestId: number) {
  return EditActions.deleteRequest(requestId);
}
