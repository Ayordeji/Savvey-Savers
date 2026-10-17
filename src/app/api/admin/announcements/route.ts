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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const announcementRecord = await db.setting.findUnique({
      where: { key: 'dashboardAnnouncement' }
    });

    const defaultAnnouncement = {
      enabled: false,
      title: '',
      message: '',
      type: 'INFO', // 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT'
      targetAudience: 'ALL', // 'ALL' | 'MEMBERS' | 'ADMINS'
      updatedAt: new Date().toISOString()
    };

    const announcement = announcementRecord ? (announcementRecord.value as any) : defaultAnnouncement;

    // Filter based on user role if disabled or targeted
    if (session.role !== 'ADMIN') {
      if (!announcement.enabled) {
        return NextResponse.json({ enabled: false, title: '', message: '', type: 'INFO', targetAudience: 'ALL' });
      }
      if (announcement.targetAudience === 'ADMINS') {
        return NextResponse.json({ enabled: false, title: '', message: '', type: 'INFO', targetAudience: 'ADMINS' });
      }
    }

    return NextResponse.json(announcement);
  } catch (err: any) {
    console.error('Error fetching announcement:', err);
    return NextResponse.json({ error: 'Failed to fetch announcement.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { enabled, title, message, type, targetAudience } = body;

    const announcementData = {
      enabled: Boolean(enabled),
      title: (title || '').trim(),
      message: (message || '').trim(),
      type: type || 'INFO',
      targetAudience: targetAudience || 'ALL',
      updatedAt: new Date().toISOString(),
      updatedBy: session.email || session.id
    };

    await db.setting.upsert({
      where: { key: 'dashboardAnnouncement' },
      update: { value: announcementData },
      create: { key: 'dashboardAnnouncement', value: announcementData }
    });

    await db.auditLog.create({
      data: {
        action: 'ADMIN_ANNOUNCEMENT_UPDATE',
        details: `Admin updated dashboard announcement: "${announcementData.title}" (Enabled: ${announcementData.enabled}).`,
        userId: session.id
      }
    });

    return NextResponse.json({ success: true, announcement: announcementData });
  } catch (err: any) {
    console.error('Error updating announcement:', err);
    return NextResponse.json({ error: 'Failed to update announcement.' }, { status: 500 });
  }
}
