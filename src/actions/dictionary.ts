'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requestSchema, SubmitRequestState } from '@/lib/schemas/dictionary';
import { Prisma } from '@/generated/prisma';
import { requireAuth } from '@/lib/auth/server-auth';

export async function submitRequest(
  prevState: SubmitRequestState,
  formData: FormData
): Promise<SubmitRequestState> {
  // Verify user is authenticated
  let user;
  try {
    const result = await requireAuth();
    user = result.user;
  } catch {
    return {
      message: 'Unauthorized: Please sign in to submit a request',
      success: false,
    };
  }

  // Parse domains manually if sent as a stringified JSON array
  const domainsRaw = formData.get('domains');
  let domains: string[] = [];
  if (typeof domainsRaw === 'string') {
    try {
      domains = JSON.parse(domainsRaw);
    } catch {
      domains = [];
    }
  }

  const validatedFields = requestSchema.safeParse({
    word: formData.get('word'),
    meaning: formData.get('meaning'),
    sourceLanguageId: formData.get('sourceLanguageId'),
    targetLanguageId: formData.get('targetLanguageId'),
    partOfSpeechId: formData.get('partOfSpeechId'),
    domains: domains,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to submit request.',
      success: false,
    };
  }

  const {
    word,
    meaning,
    sourceLanguageId,
    targetLanguageId,
    partOfSpeechId,
    domains: domainNames,
  } = validatedFields.data;

  try {
    // 1. Check if word + meaning already exists in TranslationRequest table
    const existingRequest = await prisma.translationRequest.findFirst({
      where: {
        word: { equals: word, mode: 'insensitive' },
        meaning: { equals: meaning, mode: 'insensitive' },
        sourceLanguageId,
        targetLanguageId,
        partOfSpeechId,
      },
    });

    if (existingRequest) {
      return {
        message:
          'This word with the same meaning has already been requested. Please be patient.',
        success: false,
        errors: {
          word: ['This word already has a pending translation request.'],
        },
      };
    }

    // 2. Check if word + meaning already exists in Terms table (single languageId)
    const existingTerm = await prisma.term.findFirst({
      where: {
        text: { equals: word, mode: 'insensitive' },
        meaning: { equals: meaning, mode: 'insensitive' },
        languageId: sourceLanguageId,
      },
    });

    if (existingTerm) {
      return {
        message:
          'This word with the same meaning already exists in the dictionary.',
        success: false,
        errors: {
          word: ['This word already exists in the dictionary.'],
        },
      };
    }

    // 3. Handle Domains (Find or Create)
    const domainRecords = [];
    if (domainNames && domainNames.length > 0) {
      for (const domainName of domainNames) {
        let domain = await prisma.domain.findUnique({
          where: { name: domainName },
        });

        if (!domain) {
          domain = await prisma.domain.create({
            data: { name: domainName },
          });
        }
        domainRecords.push(domain);
      }
    }

    // 4. Create the Translation Request
    await prisma.translationRequest.create({
      data: {
        word,
        meaning,
        sourceLanguageId,
        targetLanguageId,
        partOfSpeechId,
        userId: user.id,
        domains: {
          create: domainRecords.map(domain => ({
            domain: {
              connect: { id: domain.id },
            },
          })),
        },
      },
    });

    revalidatePath('/dictionary');
    return {
      success: true,
      message:
        'Request submitted successfully! It will be reviewed by an admin.',
    };
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to submit request.',
      success: false,
    };
  }
}

export interface DictionaryTerm {
  id: number;
  text: string;
  meaning: string;
  phonics: string | null;
  partOfSpeech: string;
  domains: string[];
  /** Sibling term text in the other language, resolved via conceptId */
  translation: string | null;
}

/**
 * Fetch a paginated chunk of Terms for a given language, optionally filtered by search or starting alphabet.
 * The `translation` field resolves the sibling term in `communityLanguageId`
 * via the shared conceptId — powering the dictionary page language switch.
 */
export async function getDictionaryTerms(
  languageId: number,
  communityLanguageId: number,
  options?: {
    skip?: number;
    take?: number;
    searchQuery?: string;
    alphabet?: string;
  }
): Promise<{ terms: DictionaryTerm[]; hasMore: boolean }> {
  const {
    skip = 0,
    take = 20,
    searchQuery = '',
    alphabet = '',
  } = options || {};

  const whereClause: Prisma.TermWhereInput = { languageId };

  // Apply search query across text and meaning
  if (searchQuery) {
    whereClause.OR = [
      { text: { contains: searchQuery, mode: 'insensitive' } },
      { meaning: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  if (alphabet) {
    whereClause.text = {
      ...(typeof whereClause.text === 'object' ? whereClause.text : {}),
      startsWith: alphabet,
      mode: 'insensitive',
    };
  }

  const [terms, total] = await Promise.all([
    prisma.term.findMany({
      where: whereClause,
      orderBy: { text: 'asc' },
      skip,
      take,
      include: {
        partOfSpeech: true,
        domains: { include: { domain: true } },
        concept: {
          include: {
            terms: {
              where: { languageId: communityLanguageId },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.term.count({ where: whereClause }),
  ]);

  const mappedTerms = terms.map(term => ({
    id: term.id,
    text: term.text,
    meaning: term.meaning,
    phonics: term.phonics,
    partOfSpeech: term.partOfSpeech.name,
    domains: term.domains.map(d => d.domain.name),
    translation: term.concept.terms[0]?.text ?? null,
  }));

  return {
    terms: mappedTerms,
    hasMore: skip + take < total,
  };
}

/**
 * Fetch strictly the available starting letters of all dictionary terms for a language.
 */
export async function getAvailableAlphabets(
  languageId: number
): Promise<string[]> {
  // We can select just the first characters of the terms to avoid shipping all terms.
  const terms = await prisma.term.findMany({
    where: { languageId },
    select: { text: true },
  });

  const letters = new Set(terms.map(t => t.text.charAt(0).toUpperCase()));
  return Array.from(letters).sort((a, b) => a.localeCompare(b));
}

export async function getUserProfileForRequest(userId: string) {
  try {
    return await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        uiLanguage: true,
        targetLanguages: {
          include: {
            language: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}
