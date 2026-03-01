'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';

export interface AdminConceptData {
  id: number;
  gloss: string;
  createdAt: Date;
  _count: {
    terms: number;
  };
}

export async function getAdminConcepts({
  skip = 0,
  take = 50,
  search = '',
}: {
  skip?: number;
  take?: number;
  search?: string;
}) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    const whereClause: Prisma.ConceptWhereInput = {};

    if (search) {
      whereClause.gloss = { contains: search, mode: 'insensitive' };
    }

    const [concepts, total] = await Promise.all([
      prisma.concept.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { terms: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.concept.count({ where: whereClause }),
    ]);

    return { success: true, concepts: concepts as AdminConceptData[], total };
  } catch (error) {
    console.error('Failed to get admin concepts:', error);
    return { success: false, error: 'Failed to fetch concepts' };
  }
}

const conceptSchema = z.object({
  gloss: z.string().min(1, 'Gloss is required'),
});

export async function createAdminConcept(formData: FormData) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    const data = conceptSchema.safeParse({
      gloss: formData.get('gloss'),
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const { gloss } = data.data;

    // Check for duplicates
    const existing = await prisma.concept.findFirst({
      where: {
        gloss: { equals: gloss, mode: 'insensitive' },
      },
    });

    if (existing) {
      return {
        success: false,
        error: { gloss: ['A concept with this gloss already exists.'] },
      };
    }

    await prisma.concept.create({
      data: {
        gloss,
      },
    });

    revalidatePath('/admin/dictionary-concepts');

    return { success: true };
  } catch (error) {
    console.error('Failed to create concept:', error);
    return { success: false, error: 'Database error while creating concept' };
  }
}

export async function updateAdminConcept(id: number, formData: FormData) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    const data = conceptSchema.safeParse({
      gloss: formData.get('gloss'),
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const { gloss } = data.data;

    // Check duplicate if gloss changes
    const existing = await prisma.concept.findFirst({
      where: {
        id: { not: id },
        gloss: { equals: gloss, mode: 'insensitive' },
      },
    });

    if (existing) {
      return {
        success: false,
        error: { gloss: ['Another concept with this gloss already exists.'] },
      };
    }

    await prisma.concept.update({
      where: { id },
      data: {
        gloss,
      },
    });

    revalidatePath('/admin/dictionary-concepts');

    return { success: true };
  } catch (error) {
    console.error('Failed to update concept:', error);
    return { success: false, error: 'Database error while updating concept' };
  }
}

export async function deleteAdminConcept(id: number) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    // Prevent deletion if terms are attached
    const concept = await prisma.concept.findUnique({
      where: { id },
      include: {
        _count: {
          select: { terms: true },
        },
      },
    });

    if (!concept) {
      return { success: false, error: 'Concept not found' };
    }

    if (concept._count.terms > 0) {
      return {
        success: false,
        error: `Cannot delete concept because it has ${concept._count.terms} term(s) attached. Please delete or reassign those terms first.`,
      };
    }

    await prisma.concept.delete({ where: { id } });

    revalidatePath('/admin/dictionary-concepts');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete concept:', error);
    return { success: false, error: 'Failed to delete concept' };
  }
}
