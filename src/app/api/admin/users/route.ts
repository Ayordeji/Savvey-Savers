import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';


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

  // Get all members and admins (exclude sensitive hashes in response)
  const allUsers = await db.users.findMany();

  // Sort by createdAt ascending to assign stable sequential display IDs
  const sortedUsers = [...allUsers].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  const users = sortedUsers.map((u, idx) => ({
    id: u.id,
    displayId: `M-${String(idx + 1).padStart(6, '0')}`,
    isSuperAdmin: u.isSuperAdmin === true || (u.id === 'usr_admin' && u.isSuperAdmin !== false),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    membership: u.membership,
    membershipFeeConfirmed: u.membershipFeeConfirmed,
    createdAt: u.createdAt,
    invitationId: u.invitationId,
    invitationExpiresAt: u.invitationExpiresAt,
    addressLine1: u.addressLine1,
    addressLine2: u.addressLine2,
    city: u.city,
    postCode: u.postCode,
    country: u.country,
    permissions: u.permissions
  }));

  // Reverse so newest users appear at the top of the dashboard, matching the QA site layout
  const newestFirstUsers = [...users].reverse();

  return NextResponse.json(newestFirstUsers);
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      membership,
      inviteMode,
      addressLine1,
      addressLine2,
      city,
      postCode,
      country,
      permissions
    } = body;

    const name = firstName ? `${firstName} ${lastName || ''}`.trim() : (body.name || '');

    if (!name || !email || !phone || !role || !inviteMode) {
      return NextResponse.json(
        { error: 'Name, email, phone, role, and invite mode are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check email uniqueness
    const existing = await db.users.findFirst((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    // Generate activation fields
    const invitationId = 'invite_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

    // Pre-create user in Firebase Auth so they show up in the Firebase Console immediately
    let uid = '';
    try {
      const fbUser = await adminAuth.createUser({
        email: normalizedEmail,
        displayName: name,
        disabled: false
      });
      uid = fbUser.uid;
      console.log(`Pre-created user ${normalizedEmail} in Firebase Auth (UID: ${uid}).`);
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        const existingFbUser = await adminAuth.getUserByEmail(normalizedEmail);
        uid = existingFbUser.uid;
      } else {
        console.error('Firebase Auth pre-creation failed:', authErr);
        return NextResponse.json({ error: `Firebase Auth error: ${authErr.message}` }, { status: 500 });
      }
    }

    // Create user in Firestore
    const newUser = await db.users.create({
      id: uid, // Set Document ID directly to the Firebase UID
      name,
      firstName: firstName || name.split(' ')[0] || '',
      lastName: lastName || name.split(' ').slice(1).join(' ') || '',
      email: normalizedEmail,
      phone,
      role,
      membership: membership || undefined,
      isActive: false, // will activate via setup link
      passwordHash: 'pending_activation', // placeholder
      invitationId,
      invitationExpiresAt,
      addressLine1: addressLine1 || '',
      addressLine2: addressLine2 || '',
      city: city || '',
      postCode: postCode || '',
      country: country || 'United Kingdom',
      permissions: permissions || [],
      membershipFeeConfirmed: false,
      termsAccepted: true
    });

    // Handle email triggering
    const host = request.headers.get('host') || 'savvey-savers.vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;
    const activationLink = `${origin}/activate?invite=${invitationId}`;
    let emailSubject = '';
    let emailBody = '';

    if (inviteMode === 'SAVE_INVITE') {
      emailSubject = 'Welcome to Savvey Savers - Invitation to Join';
      emailBody = `Hello ${name},\n\nYou have been invited to join the Savvey Savers Platform as a ${role === 'ADMIN' ? 'Coordinator' : 'Saver'}.\n\nClick the link below to set your password and access your dashboard:\n${activationLink}\n\nThis link is active for 72 hours.\n\nBest regards,\nSavvey Savers Team`;
    } else {
      // SAVE only mode
      emailSubject = 'Welcome to Savvey Savers - Account Registered';
      emailBody = `Hello ${name},\n\nYour account has been registered by the administrator. We will contact you when your dashboard access is ready.\n\nBest regards,\nSavvey Savers Team`;
    }

    await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      body: emailBody
    });

    // Create admin notification
    await db.notifications.create({
      userId: 'usr_admin',
      message: `User ${name} added successfully. Email invite status: ${inviteMode}.`,
      type: 'USER_ADDED',
      isRead: false
    });

    // Audit log
    await db.auditLogs.create({
      action: 'ADMIN_USER_ADD',
      details: `Admin added user ${name} (${normalizedEmail}) in mode ${inviteMode}.`,
      userId: 'usr_admin'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        membership: newUser.membership,
        createdAt: newUser.createdAt
      }
    });

  } catch (err: any) {
    console.error('Add user error:', err);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const user = await db.users.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (body.action === 'send_invite') {
      const invitationId = 'invite_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      await db.users.update({
        where: { id },
        data: { invitationId, invitationExpiresAt }
      });

      const host = request.headers.get('host') || 'savvey-savers.vercel.app';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const origin = `${protocol}://${host}`;
      const activationLink = `${origin}/activate?invite=${invitationId}`;

      const emailSubject = 'Welcome to Savvey Savers - Invitation to Join';
      const emailBody = `Hello ${user.name},\n\nYou have been invited to join the Savvey Savers Platform as a ${user.role === 'ADMIN' ? 'Coordinator' : 'Saver'}.\n\nClick the link below to set your password and access your dashboard:\n${activationLink}\n\nThis link is active for 72 hours.\n\nBest regards,\nSavvey Savers Team`;

      const mailRes = await sendEmail({
        to: user.email,
        subject: emailSubject,
        body: emailBody
      });

      if (!mailRes.success) {
        return NextResponse.json({ error: `Failed to send email: ${mailRes.error}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Invitation email resent successfully.' });
    }

    if (body.action === 'send_reset') {
      let resetLink = '';
      try {
        resetLink = await adminAuth.generatePasswordResetLink(user.email);
      } catch (authErr: any) {
        console.error('Firebase Admin generatePasswordResetLink error:', authErr);
        return NextResponse.json({ error: `Firebase Auth error: ${authErr.message}` }, { status: 500 });
      }

      const emailSubject = 'Savvey Savers - Password Reset Request';
      const emailBody = `Hello ${user.name},\n\nYou requested a password reset for your Savvey Savers account.\n\nClick the link below to reset your password:\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nSavvey Savers Team`;

      const mailRes = await sendEmail({
        to: user.email,
        subject: emailSubject,
        body: emailBody
      });

      if (!mailRes.success) {
        return NextResponse.json({ error: `Failed to send email: ${mailRes.error}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Password reset link sent.' });
    }

    let updateData: any = {};

    if ('isActive' in body) {
      updateData.isActive = !!body.isActive;
    } else if ('membershipFeeConfirmed' in body) {
      updateData.membershipFeeConfirmed = !!body.membershipFeeConfirmed;
    } else {
      const {
        firstName,
        lastName,
        email,
        phone,
        membership,
        role,
        isSuperAdmin,
        addressLine1,
        addressLine2,
        city,
        postCode,
        country,
        permissions
      } = body;

      if (!email || !phone) {
        return NextResponse.json({ error: 'Email and phone are required.' }, { status: 400 });
      }

      const name = firstName ? `${firstName} ${lastName || ''}`.trim() : (body.name || user.name);

      // Safety check: Cannot demote the current super admin
      const isCurrentlySuperAdmin = user.isSuperAdmin === true || (user.id === 'usr_admin' && user.isSuperAdmin !== false);
      if (isCurrentlySuperAdmin && isSuperAdmin === false) {
        return NextResponse.json({ error: 'Cannot demote the Super Admin. You must promote another Admin user to Super Admin instead.' }, { status: 400 });
      }

      updateData = {
        name,
        firstName: firstName || user.firstName || name.split(' ')[0] || '',
        lastName: lastName || user.lastName || name.split(' ').slice(1).join(' ') || '',
        email: email.toLowerCase().trim(),
        phone,
        membership: membership || undefined,
        role: role || undefined,
        addressLine1: addressLine1 ?? user.addressLine1,
        addressLine2: addressLine2 ?? user.addressLine2,
        city: city ?? user.city,
        postCode: postCode ?? user.postCode,
        country: country ?? user.country,
        permissions: permissions ?? user.permissions
      };

      // If promoting to Super Admin, handle the transfer safely
      if (isSuperAdmin === true) {
        const targetRole = role || user.role;
        if (targetRole !== 'ADMIN') {
          return NextResponse.json({ error: 'Only administrators can be promoted to Super Admin.' }, { status: 400 });
        }

        const allUsers = await db.users.findMany();
        const currentSuperAdmin = allUsers.find(u => u.isSuperAdmin === true || (u.id === 'usr_admin' && u.isSuperAdmin !== false));
        if (currentSuperAdmin && currentSuperAdmin.id !== id) {
          await db.users.update({
            where: { id: currentSuperAdmin.id },
            data: { isSuperAdmin: false }
          });
          console.log(`Transferred Super Admin role from ${currentSuperAdmin.id} to ${id}.`);
        }
        updateData.isSuperAdmin = true;
      }
    }

    await db.users.update({
      where: { id },
      data: updateData
    });

    await db.auditLogs.create({
      action: 'ADMIN_USER_UPDATE',
      details: `Admin updated user details for ${user.email}.`,
      userId: 'usr_admin'
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Update user error:', err);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id') || searchParams.get('ids');

    if (!idParam) {
      return NextResponse.json({ error: 'User ID(s) are required.' }, { status: 400 });
    }

    const ids = idParam.split(',').map(id => id.trim()).filter(Boolean);
    const deletedIds: string[] = [];
    const errors: string[] = [];

    for (const id of ids) {
      const user = await db.users.findUnique({ where: { id } });
      if (!user) {
        errors.push(`User with ID ${id} not found.`);
        continue;
      }

      // Check if the user is the current super admin
      const isSuperAdmin = user.isSuperAdmin === true || (user.id === 'usr_admin' && user.isSuperAdmin !== false);
      if (isSuperAdmin) {
        errors.push(`The Super Admin account (${user.name}) cannot be deleted.`);
        continue;
      }

      // Archive / Move to deleted records
      await db.deletedRecords.create({
        type: 'USER',
        originalData: user,
        deletedAt: new Date().toISOString()
      });

      // Delete user from active users in database
      await db.users.delete({ where: { id } });

      // Clean up related commitments (archive them too)
      const relatedCommitments = await db.commitments.findMany((c) => c.memberId === id);
      for (const cmt of relatedCommitments) {
        await db.deletedRecords.create({
          type: 'COMMITMENT',
          originalData: cmt,
          deletedAt: new Date().toISOString()
        });
        await db.commitments.delete({ where: { id: cmt.id } });
      }

      // Delete from Firebase Auth
      try {
        await adminAuth.deleteUser(id);
        console.log(`Deleted user ${id} from Firebase Auth.`);
      } catch (authErr: any) {
        console.warn(`User ${id} not found in Firebase Auth or failed to delete:`, authErr.message);
      }

      // Audit log
      await db.auditLogs.create({
        action: 'ADMIN_USER_DELETE',
        details: `Admin deleted user ${user.name} (${user.email}) and archived all records.`,
        userId: 'usr_admin'
      });

      deletedIds.push(id);
    }

    if (errors.length > 0 && deletedIds.length === 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedIds, errors: errors.length > 0 ? errors : undefined });

  } catch (err: any) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
