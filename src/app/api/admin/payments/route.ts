import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const commitmentId = searchParams.get('commitmentId');

  let payments = [];
  if (commitmentId) {
    // Verify ownership for members
    const cmt = await db.commitment.findUnique({ where: { id: commitmentId } });
    if (!cmt) {
      return NextResponse.json({ error: 'Commitment not found.' }, { status: 404 });
    }
    if (session.role !== 'ADMIN' && cmt.memberId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    payments = (await db.payment.findMany({ where: { commitmentId: commitmentId } })).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else {
    if (session.role !== 'ADMIN') {
      const dbUser = (await db.user.findUnique({ where: { id: session.id } })) ||
        (session.email ? await db.user.findUnique({ where: { email: session.email } }) : null);

      const userKeys = Array.from(new Set([
        session.id,
        session.email,
        dbUser?.id,
        dbUser?.displayId,
        dbUser?.email
      ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0)));

      const memberCmts = await db.commitment.findMany({
        where: {
          OR: [
            ...userKeys.map(k => ({ memberId: k })),
            ...(dbUser?.name ? [{ memberName: dbUser.name }] : [])
          ]
        },
        select: { id: true }
      });
      const cmtIds = memberCmts.map(c => c.id);

      payments = (await db.payment.findMany({
        where: {
          OR: [
            ...userKeys.map(k => ({ userId: k })),
            ...(cmtIds.length > 0 ? [{ commitmentId: { in: cmtIds } }] : [])
          ]
        }
      })).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      payments = (await db.payment.findMany()).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  return NextResponse.json(payments);
}
