import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { invitationId, password } = await request.json();

    if (!invitationId || !password) {
      return NextResponse.json(
        { error: 'Invitation ID and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Look up user by invitation ID
    const user = await db.users.findFirst(
      (u) => u.invitationId === invitationId && !u.isActive
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation link.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (user.invitationExpiresAt && new Date() > new Date(user.invitationExpiresAt)) {
      return NextResponse.json(
        { error: 'Invitation link has expired (72h limit). Please contact your administrator.' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth using the email address and password
    let uid = '';
    try {
      const fbUser = await adminAuth.createUser({
        email: user.email,
        password: password,
        displayName: user.name,
      });
      uid = fbUser.uid;
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/email-already-exists') {
        const existingFbUser = await adminAuth.getUserByEmail(user.email);
        uid = existingFbUser.uid;
        await adminAuth.updateUser(uid, { password });
      } else {
        throw fbErr;
      }
    }

    // Activate the user in Firestore by re-creating user document with doc ID = Firebase UID
    await db.users.delete({ where: { id: user.id } });
    
    await db.users.create({
      ...user,
      id: uid,
      isActive: true,
      invitationId: null,
      invitationExpiresAt: null
    });

    // System notifications
    await db.notifications.create({
      userId: uid,
      message: `Welcome to Savvey Savers! Your account has been activated successfully.`,
      type: 'ACCOUNT_ACTIVATION',
      isRead: false
    });

    // Admin audit log
    await db.auditLogs.create({
      action: 'USER_ACTIVATION',
      details: `User ${user.email} activated their account using invitation link.`,
      userId: uid
    });

    return NextResponse.json({
      success: true,
      email: user.email
    });
  } catch (err: any) {
    console.error('Activation error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during account activation.' },
      { status: 500 }
    );
  }
}
