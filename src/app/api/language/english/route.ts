import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/language/english
 * Returns the database ID for the English language (seeded with code 'eng').
 * Used by the dictionary page to resolve the English languageId without hardcoding.
 */
export async function GET() {
  try {
    const language = await prisma.language.findUnique({
      where: { code: 'eng' },
      select: { id: true, name: true },
    });

    if (!language) {
      return NextResponse.json(
        { error: 'English language not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: language.id, name: language.name });
  } catch (error) {
    console.error('Failed to fetch English language:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
