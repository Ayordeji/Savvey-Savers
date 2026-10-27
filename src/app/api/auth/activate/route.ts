import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';


export async function POST(request: Request) {
  try {
    const {
      invitationId,
      password,
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      city,
      postCode,
      country,
      termsAccepted,
      securityQuestions,
    } = await request.json();

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

    // Look up user by invitation ID, displayId (e.g. M-000426), or ID
    let user = await db.user.findFirst({
      where: { invitationId }
    });

    if (!user) {
      user = await db.user.findFirst({
        where: {
          OR: [
            { displayId: invitationId },
            { id: invitationId }
          ]
        }
      });

      // Block activation only if they are active AND have a password AND have
      // actually logged in at least once. Migrated members may be isActive:true
      // with a passwordHash but lastLoginAt=null — they need to log in for the
      // first time, not re-activate. Direct them to /login instead.
      if (user?.isActive && user?.passwordHash) {
        if (user.lastLoginAt) {
          // Fully onboarded — they've logged in before, send to login.
          return NextResponse.json(
            { error: 'This account is already active. Please log in instead.', loginRedirect: true },
            { status: 400 }
          );
        } else {
          // Migrated member: active + password set but never logged in.
          // Let them proceed via login page rather than re-activating.
          return NextResponse.json(
            { error: 'Your account is ready. Please log in using your email and password.', loginRedirect: true },
            { status: 400 }
          );
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation link.' },
        { status: 400 }
      );
    }

    // If the link has expired but the account is NOT yet activated, auto-extend
    // rather than blocking. This handles members who received old invite_ style links.
    if (user.invitationExpiresAt && new Date() > new Date(user.invitationExpiresAt)) {
      if (user.passwordHash && user.passwordHash !== 'pending_activation') {
        // Already activated — reject
        return NextResponse.json(
          { error: 'Invitation link has expired. Please contact your administrator for a new one.' },
          { status: 400 }
        );
      }
      // Not yet activated — silently extend expiry and continue
      await db.user.update({
        where: { id: user.id },
        data: { invitationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }
      });
    }

    const updatedFirstName = (firstName || user.firstName || '').trim();
    const updatedLastName = (lastName || user.lastName || '').trim();
    const fullName = `${updatedFirstName} ${updatedLastName}`.trim() || user.name;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const uid = user.id;

    const updatedData = {
      isActive: true,
      invitationId: null,
      invitationExpiresAt: null,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      name: fullName,
      passwordHash: passwordHash,
      phone: (phone || user.phone || '').trim(),
      addressLine1: (addressLine1 || user.addressLine1 || '').trim(),
      addressLine2: (addressLine2 || user.addressLine2 || '').trim(),
      city: (city || user.city || '').trim(),
      postCode: (postCode || user.postCode || '').trim(),
      country: 'UNITED KINGDOM',
      termsAccepted: termsAccepted === true,
    };

    // Activate the user
    await db.user.update({
      where: { id: user.id },
      data: updatedData,
    });

    // System notifications
    await db.notification.create({ data: {
      userId: uid,
      message: `Welcome to Savvey Savers! Your account has been activated successfully.`,
      type: 'ACCOUNT_ACTIVATION',
      isRead: false
    } });

    // Admin audit log
    await db.auditLog.create({ data: {
      action: 'USER_ACTIVATION',
      details: `User ${user.email} activated their account using invitation link.`,
      userId: uid
    } });

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invite') || searchParams.get('reset');

    if (!invitationId) {
      return NextResponse.json(
        { valid: false, error: 'Missing invitation or reset code in the URL. Please verify your link.' },
        { status: 400 }
      );
    }

    let user = await db.user.findFirst({
      where: { invitationId }
    });

    if (!user) {
      user = await db.user.findFirst({
        where: {
          OR: [
            { displayId: invitationId },
            { id: invitationId }
          ]
        }
      });

      // Block activation only if they are active AND have a password AND have
      // actually logged in at least once. Migrated members may be isActive:true
      // with a passwordHash but lastLoginAt=null — they need to log in for the
      // first time, not re-activate.
      if (user?.isActive && user?.passwordHash) {
        if (user.lastLoginAt) {
          return NextResponse.json(
            { valid: false, error: 'This account is already active. Please log in instead.', loginRedirect: true },
            { status: 400 }
          );
        } else {
          // Migrated: active + password but never logged in — send to login.
          return NextResponse.json(
            { valid: false, error: 'Your account is ready. Please log in with your email and password.', loginRedirect: true },
            { status: 400 }
          );
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'This invitation link is invalid or has already been used.' },
        { status: 400 }
      );
    }

    // If the link has expired but the account is not yet activated, auto-extend
    // rather than blocking (handles members with old invite_ format links).
    if (user.invitationExpiresAt && new Date() > new Date(user.invitationExpiresAt)) {
      if (user.passwordHash && user.passwordHash !== 'pending_activation') {
        // Already activated — reject
        return NextResponse.json(
          { valid: false, error: 'This invitation link has expired. Please contact your administrator for a new one.' },
          { status: 400 }
        );
      }
      // Not yet activated — silently extend expiry and continue
      await db.user.update({
        where: { id: user.id },
        data: { invitationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }
      });
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      postCode: user.postCode,
    });
  } catch (err: any) {
    console.error('Verify invitation error:', err);
    return NextResponse.json(
      { valid: false, error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
