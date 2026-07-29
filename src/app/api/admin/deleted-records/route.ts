import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'ADMIN';
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const records = await db.deletedRecord.findMany({
      orderBy: { deletedAt: 'desc' }
    });
    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch deleted records' }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await db.deletedRecord.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error clearing deleted records:', err);
    return NextResponse.json({ error: 'Failed to clear archive.' }, { status: 500 });
  }
}
