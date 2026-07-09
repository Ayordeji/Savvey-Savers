import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

// Helper to verify admin role
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
  const emails = (await db.mockEmails.findMany()).sort(
    (a, b) => new Date(b.sentAt || '').getTime() - new Date(a.sentAt || '').getTime()
  );
  return NextResponse.json(emails);
}

export async function DELETE() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Clear all mock emails
  const emails = await db.mockEmails.findMany();
  for (const email of emails) {
    await db.mockEmails.delete({ where: { id: email.id } });
  }

  return NextResponse.json({ success: true });
}
