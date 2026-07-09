import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const sessionCookie = request.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith(`${COOKIE_NAME}=`))
      ?.split('=')[1];

    let userId = 'unknown';
    if (sessionCookie) {
      const payload = await verifyToken(sessionCookie);
      if (payload) {
        userId = payload.id;
      }
    }

    const response = NextResponse.json({ success: true });
    
    // Clear cookie
    response.cookies.delete(COOKIE_NAME);

    // Audit log
    await db.auditLogs.create({
      action: 'USER_LOGOUT',
      details: 'User logged out and session cookie cleared.',
      userId: userId
    });

    return response;
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
