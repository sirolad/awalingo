'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';

export interface AdminDomainData {
  id: number;
  name: string;
  _count: {
    terms: number;
    requests: number;
  };
}

export async function getAdminDomains({
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

    const whereClause: Prisma.DomainWhereInput = {};
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const [domains, total] = await Promise.all([
      prisma.domain.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip,
        take,
        include: {
          _count: {
            select: { terms: true, requests: true },
          },
        },
      }),
      prisma.domain.count({ where: whereClause }),
    ]);

    return {
      success: true,
      domains: domains as AdminDomainData[],
      total,
    };
  } catch (error) {
    console.error('Failed to get admin domains:', error);
    return { success: false, error: 'Failed to fetch domains' };
  }
}

const domainSchema = z.object({
  name: z.string().min(1, 'Domain name is required').max(100),
});

export async function createAdminDomain(formData: FormData) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    const data = domainSchema.safeParse({
      name: formData.get('name'),
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const name = data.data.name.trim();

    // Check for duplicates
    const existing = await prisma.domain.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return {
        success: false,
        error: { name: ['Domain with this name already exists.'] },
      };
    }

    await prisma.domain.create({
      data: { name },
    });

    revalidatePath('/admin/dictionary-domains');
    return { success: true };
  } catch (error) {
    console.error('Failed to create domain:', error);
    return { success: false, error: 'Database error while creating domain' };
  }
}

export async function updateAdminDomain(id: number, formData: FormData) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    const data = domainSchema.safeParse({
      name: formData.get('name'),
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const name = data.data.name.trim();

    // Check for duplicates excluding current
    const existing = await prisma.domain.findFirst({
      where: {
        id: { not: id },
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      return {
        success: false,
        error: { name: ['Another domain with this name already exists.'] },
      };
    }

    await prisma.domain.update({
      where: { id },
      data: { name },
    });

    revalidatePath('/admin/dictionary-domains');
    return { success: true };
  } catch (error) {
    console.error('Failed to update domain:', error);
    return { success: false, error: 'Database error while updating domain' };
  }
}

export async function deleteAdminDomain(id: number) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    // First check if it's in use
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        _count: {
          select: { terms: true, requests: true },
        },
      },
    });

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    if (domain._count.terms > 0 || domain._count.requests > 0) {
      return {
        success: false,
        error: `Cannot delete: Domain is used in ${domain._count.terms} term(s) and ${domain._count.requests} request(s).`,
      };
    }

    await prisma.domain.delete({ where: { id } });

    revalidatePath('/admin/dictionary-domains');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete domain:', error);
    return { success: false, error: 'Failed to delete domain' };
  }
}
