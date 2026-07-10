import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/firebase-admin';
import { createSessionCookie, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // CSRF Mitigation Check
    const origin = request.headers.get('origin');
    const host = request.headers.get('host') || '';
    if (origin) {
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
      const isAllowedOrigin = isLocalhost || (host && origin.includes(host));
      if (!isAllowedOrigin) {
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
      }
    }

    const { idToken, name: reqName, phone: reqPhone } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Firebase ID Token is required' },
        { status: 400 }
      );
    }

    let uid = '';
    let email = '';
    let tokenName = '';

    const isMockToken = idToken.startsWith('mock_token_');
    const isDev = process.env.NODE_ENV !== 'production';

    if (isMockToken && isDev) {
      const payloadStr = idToken.substring('mock_token_'.length);
      const parts = payloadStr.split('_');
      email = parts[0].toLowerCase().trim();
      tokenName = decodeURIComponent(parts.slice(1).join('_') || 'Google User').trim();
      uid = 'usr_mock_' + Buffer.from(email).toString('hex').substring(0, 10);
    } else {
      // Verify the Firebase ID Token
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email || '';
      tokenName = decodedToken.name || '';
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email claim is missing from Firebase token' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user document exists in Firestore (primary lookup by UID)
    let user = await db.users.findUnique({ where: { id: uid } });

    // Fallback: If not found by UID, lookup by email (e.g., if pre-seeded or invited)
    if (!user) {
      user = await db.users.findFirst((u) => u.email.toLowerCase() === normalizedEmail);
      if (user) {
        // If found by email, update their document to use the Firebase UID as the document ID
        await db.users.delete({ where: { id: user.id } });
        user = await db.users.create({
          ...user,
          id: uid,
          isActive: true
        });
      }
    }

    let isNewUser = false;
 
    // Auto-registration check: only allow pre-invited users or the default admin@savveysavers.com initializer
    if (!user) {
      const isDefaultAdmin = normalizedEmail === 'admin@savveysavers.com';
      if (!isDefaultAdmin) {
        return NextResponse.json(
          { error: 'Your email address is not registered on the platform. Please join the waiting list to request access.' },
          { status: 403 }
        );
      }

      isNewUser = true;
      user = await db.users.create({
        id: uid,
        name: reqName || tokenName || email.split('@')[0],
        email: normalizedEmail,
        phone: reqPhone || '',
        role: 'ADMIN',
        isActive: true,
      });
 
      // System notification
      await db.notifications.create({
        userId: user.id,
        message: `Welcome to Savvey Savers! Your account has been registered successfully.`,
        type: 'ACCOUNT_ACTIVATION',
        isRead: false
      });
    }

    // Generate Firebase Session Cookie
    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        membership: user.membership || null
      }
    });

    // Set cookie headers
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 5, // 5 days
    });

    // Record login audit event
    await db.auditLogs.create({
      action: isNewUser ? 'USER_SIGNUP_FIREBASE' : 'USER_LOGIN_FIREBASE',
      details: `User ${user.email} logged in via Firebase Auth.`,
      userId: user.id
    });

    return response;
  } catch (err: any) {
    console.error('Firebase Login API error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
