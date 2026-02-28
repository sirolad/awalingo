'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface AdminTermData {
  id: number;
  text: string;
  meaning: string;
  phonics: string | null;
  language: { id: number; name: string };
  partOfSpeech: { id: number; name: string };
  domains: { domain: { id: number; name: string } }[];
  conceptId: number;
  voteScore: number;
  createdAt: Date;
}

export async function getAdminTerms({
  skip = 0,
  take = 50,
  search = '',
  languageId,
}: {
  skip?: number;
  take?: number;
  search?: string;
  languageId?: number;
}) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { text: { contains: search, mode: 'insensitive' } },
        { meaning: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (languageId) {
      whereClause.languageId = languageId;
    }

    const [terms, total] = await Promise.all([
      prisma.term.findMany({
        where: whereClause,
        include: {
          language: { select: { id: true, name: true } },
          partOfSpeech: { select: { id: true, name: true } },
          domains: {
            include: { domain: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.term.count({ where: whereClause }),
    ]);

    return { success: true, terms: terms as AdminTermData[], total };
  } catch (error) {
    console.error('Failed to get admin terms:', error);
    return { success: false, error: 'Failed to fetch terms' };
  }
}

const termSchema = z.object({
  text: z.string().min(1, 'Word text is required').max(100),
  meaning: z.string().min(1, 'Meaning is required'),
  phonics: z.string().optional().nullable(),
  languageId: z.number().positive('Language is required'),
  partOfSpeechId: z.number().positive('Part of Speech is required'),
  domains: z.array(z.string()).optional(),
});

export async function createAdminTerm(formData: FormData) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');
    // Basic auth check for admin functionality can be added here
    
    // Parse domains from stringified JSON if needed
    let domains: string[] = [];
    const domainsRaw = formData.get('domains');
    if (typeof domainsRaw === 'string') {
      try {
        domains = JSON.parse(domainsRaw);
      } catch {
        domains = [];
      }
    }

    const data = termSchema.safeParse({
      text: formData.get('text'),
      meaning: formData.get('meaning'),
      phonics: formData.get('phonics') || null,
      languageId: Number(formData.get('languageId')),
      partOfSpeechId: Number(formData.get('partOfSpeechId')),
      domains,
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const { text, meaning, phonics, languageId, partOfSpeechId, domains: domainNames } = data.data;

    // Check for duplicates based on the unique constraint
    const existing = await prisma.term.findFirst({
      where: {
        text: { equals: text, mode: 'insensitive' },
        meaning: { equals: meaning, mode: 'insensitive' },
        languageId,
      },
    });

    if (existing) {
      return { success: false, error: { text: ['Term with this text and meaning already exists in this language.'] } };
    }

    await prisma.$transaction(async tx => {
      // Create new concept tied to this meaning
      const concept = await tx.concept.create({
        data: { gloss: meaning },
      });

      // Handle domains
      const domainRecords = [];
      if (domainNames && domainNames.length > 0) {
        for (const name of domainNames) {
          let domain = await tx.domain.findUnique({ where: { name } });
          if (!domain) {
            domain = await tx.domain.create({ data: { name } });
          }
          domainRecords.push(domain);
        }
      }

      await tx.term.create({
        data: {
          text,
          meaning,
          phonics,
          languageId,
          partOfSpeechId,
          conceptId: concept.id,
          domains: {
            create: domainRecords.map(d => ({ domain: { connect: { id: d.id } } })),
          },
        },
      });
    });

    revalidatePath('/admin/dictionary-terms');
    revalidatePath('/dictionary');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to create term:', error);
    return { success: false, error: 'Database error while creating term' };
  }
}

export async function updateAdminTerm(id: number, formData: FormData) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');
    
    let domains: string[] = [];
    const domainsRaw = formData.get('domains');
    if (typeof domainsRaw === 'string') {
      try {
        domains = JSON.parse(domainsRaw);
      } catch {
        domains = [];
      }
    }

    const data = termSchema.safeParse({
      text: formData.get('text'),
      meaning: formData.get('meaning'),
      phonics: formData.get('phonics') || null,
      languageId: Number(formData.get('languageId')),
      partOfSpeechId: Number(formData.get('partOfSpeechId')),
      domains,
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const { text, meaning, phonics, languageId, partOfSpeechId, domains: domainNames } = data.data;

    // Check duplicate if text/meaning/lang changes
    const existing = await prisma.term.findFirst({
      where: {
        id: { not: id },
        text: { equals: text, mode: 'insensitive' },
        meaning: { equals: meaning, mode: 'insensitive' },
        languageId,
      },
    });

    if (existing) {
      return { success: false, error: { text: ['Another term with this text and meaning already exists.'] } };
    }

    await prisma.$transaction(async tx => {
      const domainRecords = [];
      if (domainNames && domainNames.length > 0) {
        for (const name of domainNames) {
          let domain = await tx.domain.findUnique({ where: { name } });
          if (!domain) {
            domain = await tx.domain.create({ data: { name } });
          }
          domainRecords.push(domain);
        }
      }

      // First clear old domains
      await tx.domainsOnTerms.deleteMany({ where: { termId: id } });

      // Then update term and add new domains
      await tx.term.update({
        where: { id },
        data: {
          text,
          meaning,
          phonics,
          languageId,
          partOfSpeechId,
          domains: {
            create: domainRecords.map(d => ({ domain: { connect: { id: d.id } } })),
          },
        },
      });
    });

    revalidatePath('/admin/dictionary-terms');
    revalidatePath('/dictionary');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update term:', error);
    return { success: false, error: 'Database error while updating term' };
  }
}

export async function deleteAdminTerm(id: number) {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    await prisma.term.delete({ where: { id } });

    revalidatePath('/admin/dictionary-terms');
    revalidatePath('/dictionary');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete term:', error);
    return { success: false, error: 'Failed to delete term' };
  }
}
