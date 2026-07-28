import { NextResponse } from 'next/server';
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

  // deletedRecord model has been removed from schema, returning empty array
  return NextResponse.json([]);
}

export async function DELETE() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // deletedRecord model has been removed from schema, doing nothing
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error clearing deleted records:', err);
    return NextResponse.json({ error: 'Failed to clear archive.' }, { status: 500 });
  }
}
