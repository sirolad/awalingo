import createClient from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assignRole } from '@/lib/roles';
import z from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'CONTRIBUTOR', 'JURY']),
  firstCall: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedBody = BodySchema.parse(body);

    const { userId, role, firstCall } = parsedBody;

    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') || undefined;
    const supabase = token ? await createClient(token) : await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // check if the caller is admin
    const dbUser = await prisma.userRole.findFirst({
      where: { userId: user.id },
      include: { role: true },
    });

    if (dbUser?.role?.name !== 'ADMIN' && firstCall !== user?.id) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const result = await assignRole(userId, role);

    return NextResponse.json({ success: true, result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.message || 'Validation error' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
