import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

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

  const records = (await db.deletedRecords.findMany()).sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );
  return NextResponse.json(records);
}

export async function DELETE() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const records = await db.deletedRecords.findMany();
    for (const r of records) {
      await db.deletedRecords.delete({ where: { id: r.id } });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error clearing deleted records:', err);
    return NextResponse.json({ error: 'Failed to clear archive.' }, { status: 500 });
  }
}
