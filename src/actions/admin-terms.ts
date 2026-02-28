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
  concept: { id: number; gloss: string };
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
          concept: { select: { id: true, gloss: true } },
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
  conceptId: z.number().nullable().optional(),
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

    const conceptIdRaw = formData.get('conceptId');
    const data = termSchema.safeParse({
      text: formData.get('text'),
      meaning: formData.get('meaning'),
      conceptId: conceptIdRaw ? Number(conceptIdRaw) : null,
      phonics: formData.get('phonics') || null,
      languageId: Number(formData.get('languageId')),
      partOfSpeechId: Number(formData.get('partOfSpeechId')),
      domains,
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const {
      text,
      meaning,
      conceptId,
      phonics,
      languageId,
      partOfSpeechId,
      domains: domainNames,
    } = data.data;

    // Check for duplicates based on the unique constraint
    const existing = await prisma.term.findFirst({
      where: {
        text: { equals: text, mode: 'insensitive' },
        meaning: { equals: meaning, mode: 'insensitive' },
        languageId,
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          text: [
            'Term with this text and meaning already exists in this language.',
          ],
        },
      };
    }

    await prisma.$transaction(async tx => {
      // Create new concept or use existing
      let resolvedConceptId = conceptId;
      if (!resolvedConceptId) {
        const concept = await tx.concept.create({
          data: { gloss: meaning },
        });
        resolvedConceptId = concept.id;
      }

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
          conceptId: resolvedConceptId,
          domains: {
            create: domainRecords.map(d => ({
              domain: { connect: { id: d.id } },
            })),
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

    const conceptIdRaw = formData.get('conceptId');
    const data = termSchema.safeParse({
      text: formData.get('text'),
      meaning: formData.get('meaning'),
      conceptId: conceptIdRaw ? Number(conceptIdRaw) : null,
      phonics: formData.get('phonics') || null,
      languageId: Number(formData.get('languageId')),
      partOfSpeechId: Number(formData.get('partOfSpeechId')),
      domains,
    });

    if (!data.success) {
      return { success: false, error: data.error.flatten().fieldErrors };
    }

    const {
      text,
      meaning,
      conceptId,
      phonics,
      languageId,
      partOfSpeechId,
      domains: domainNames,
    } = data.data;

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
      return {
        success: false,
        error: {
          text: ['Another term with this text and meaning already exists.'],
        },
      };
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

      // Clear old domains
      await tx.domainsOnTerms.deleteMany({ where: { termId: id } });

      let resolvedConceptId = conceptId;
      if (!resolvedConceptId) {
        const concept = await tx.concept.create({
          data: { gloss: meaning },
        });
        resolvedConceptId = concept.id;
      }

      // Update term and add new domains
      await tx.term.update({
        where: { id },
        data: {
          text,
          meaning,
          phonics,
          languageId,
          partOfSpeechId,
          conceptId: resolvedConceptId,
          domains: {
            create: domainRecords.map(d => ({
              domain: { connect: { id: d.id } },
            })),
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

export interface BulkUploadTermInput {
  text: string;
  meaning: string;
  partOfSpeech: string;
  phonics?: string;
  domains?: string[];
  languageId: number;
}

export async function bulkAddAdminTerms(terms: BulkUploadTermInput[]) {
  try {
    const { user } = await requireAuth();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Group incoming valid terms by their exact meaning to reuse conceptIds
    // Also, map parts of speech to IDs
    let addedCount = 0;
    const errors: string[] = [];

    // Fetch parts of speech to map names to IDs
    const posList = await prisma.partOfSpeech.findMany();
    const posMap = new Map(
      posList.map(p => [p.name.toLowerCase().trim(), p.id])
    );

    // Process them in a transaction chunk or individually to isolate errors
    // To be efficient but safe, doing sequential batches
    for (const termInput of terms) {
      const { text, meaning, partOfSpeech, phonics, domains, languageId } =
        termInput;

      const posId = posMap.get(partOfSpeech.toLowerCase().trim());
      if (!posId) {
        errors.push(`Row "${text}": Unknown part of speech "${partOfSpeech}"`);
        continue;
      }

      const normalizedMeaning = meaning.trim();
      const normalizedGlossKey = normalizedMeaning.toLowerCase();

      try {
        await prisma.$transaction(async tx => {
          // 1. Resolve or Create Concept
          let conceptRecord = await tx.concept.findUnique({
            where: { gloss: normalizedGlossKey }, // assuming unique gloss applies to lowercased values natively on pg or we search case-insensitively
          });

          if (!conceptRecord) {
            // Case-insensitive fallback if the `@unique` constraint is exact casing
            conceptRecord = await tx.concept.findFirst({
              where: {
                gloss: { equals: normalizedGlossKey, mode: 'insensitive' },
              },
            });
          }

          if (!conceptRecord) {
            conceptRecord = await tx.concept.create({
              data: { gloss: normalizedMeaning },
            });
          }

          // 2. Resolve or Create Domains
          const domainConnections = [];
          if (domains && domains.length > 0) {
            for (const dom of domains) {
              const domName = dom.trim();
              if (!domName) continue;

              let domainRecord = await tx.domain.findUnique({
                where: { name: domName },
              });
              if (!domainRecord) {
                // Fallback case-insensitive
                domainRecord = await tx.domain.findFirst({
                  where: { name: { equals: domName, mode: 'insensitive' } },
                });
                if (!domainRecord) {
                  domainRecord = await tx.domain.create({
                    data: { name: domName },
                  });
                }
              }
              domainConnections.push(domainRecord.id);
            }
          }

          // 3. Create the Term
          await tx.term.create({
            data: {
              text: text.trim(),
              meaning: normalizedMeaning,
              phonics: phonics?.trim() || null,
              languageId,
              partOfSpeechId: posId,
              conceptId: conceptRecord.id,
              domains: {
                create: domainConnections.map(id => ({
                  domain: { connect: { id } },
                })),
              },
            },
          });
        });

        addedCount++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          errors.push(`Row "${text}": Already exists in the database.`);
        } else {
          errors.push(`Row "${text}": Failed to insert. ${e.message}`);
        }
      }
    }

    revalidatePath('/admin/dictionary-terms');
    revalidatePath('/dictionary');

    return {
      success: true,
      count: addedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Failed to bulk add terms:', error);
    return { success: false, error: 'Database error during bulk import' };
  }
}

export async function getTotalAdminTermCount(): Promise<{
  success: boolean;
  count: number;
}> {
  try {
    const { user } = await requireAuth();
    if (!user) throw new Error('Unauthorized');

    const count = await prisma.term.count();
    return { success: true, count };
  } catch (err) {
    console.error('Failed to get total term count:', err);
    return { success: false, count: 0 };
  }
}
