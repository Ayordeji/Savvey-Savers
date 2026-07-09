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

  // Get notifications (Admin gets all, Member gets own)
  let notifications = [];
  if (session.role === 'ADMIN') {
    notifications = await db.notifications.findMany();
  } else {
    notifications = await db.notifications.findMany((n) => n.userId === session.id);
  }

  // Sort newest first
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const notification = await db.notifications.findUnique({ where: { id } });
    if (notification) {
      await db.notifications.update({
        where: { id },
        data: { isRead: true }
      });
    }
  } else {
    const userNotifications = await db.notifications.findMany(
      (n) => n.userId === session.id && !n.isRead
    );
    for (const n of userNotifications) {
      await db.notifications.update({
        where: { id: n.id },
        data: { isRead: true }
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const notification = await db.notifications.findUnique({ where: { id } });
      if (!notification) {
        return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
      }

      // Security check: normal user can only delete their own notifications
      if (session.role !== 'ADMIN' && notification.userId !== session.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      await db.notifications.delete({ where: { id } });
    } else {
      // Wipes all notifications visible to this user
      let userNotifications = [];
      if (session.role === 'ADMIN') {
        userNotifications = await db.notifications.findMany();
      } else {
        userNotifications = await db.notifications.findMany((n) => n.userId === session.id);
      }
      for (const n of userNotifications) {
        await db.notifications.delete({ where: { id: n.id } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting notifications:', err);
    return NextResponse.json({ error: 'Failed to delete notifications.' }, { status: 500 });
  }
}
