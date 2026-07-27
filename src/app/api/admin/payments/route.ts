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
    // Return all payments for admin
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }
    payments = (await db.payment.findMany()).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return NextResponse.json(payments);
}
