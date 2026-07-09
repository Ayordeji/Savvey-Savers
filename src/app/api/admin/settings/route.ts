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

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get both savingGoals and commitmentAmounts
  const savingGoals = (await db.settings.findUnique({ where: { key: 'savingGoals' } }))?.value || [];
  const commitmentAmounts = (await db.settings.findUnique({ where: { key: 'commitmentAmounts' } }))?.value || [];

  return NextResponse.json({
    savingGoals,
    commitmentAmounts
  });
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { key, value } = await request.json();

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required.' }, { status: 400 });
    }

    // Save/update settings
    const existing = await db.settings.findUnique({ where: { key } });
    if (existing) {
      await db.settings.update({
        where: { key },
        data: { value }
      });
    } else {
      await db.settings.create({
        key,
        value
      });
    }

    await db.auditLogs.create({
      action: 'ADMIN_SETTINGS_UPDATE',
      details: `Admin updated settings configuration for key: ${key}.`,
      userId: 'usr_admin'
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Update settings error:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
