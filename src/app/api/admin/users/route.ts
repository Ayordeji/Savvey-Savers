import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';


async function checkAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  const user = await db.users.findUnique({ where: { id: payload.id } });
  return user;
}

async function checkAdmin() {
  const user = await checkAdminUser();
  return user;
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
    membershipFeeConfirmedAt: u.membershipFeeConfirmedAt || null,
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
      isActive: true, // Default to active
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

    // Handle email triggering using template settings
    const host = request.headers.get('host') || 'savvey-savers.vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;
    const activationLink = `${origin}/activate?invite=${invitationId}`;

    const templates = (await db.settings.findUnique({ where: { key: 'emailTemplates' } }))?.value || [];
    
    // Find Template 2 ("Savvey Savers Account Registration") or Template 7
    const templateId = inviteMode === 'SAVE_INVITE' ? '7' : '2';
    const foundTpl = templates.find((t: any) => t.id === templateId || (inviteMode === 'SAVE_INVITE' ? t.title.includes('Join') : t.title.includes('Registration')));

    let emailSubject = inviteMode === 'SAVE_INVITE' ? 'Welcome to Savvey Savers - Invitation to Join' : 'Welcome to Savvey Savers - Account Registered';
    let emailBody = inviteMode === 'SAVE_INVITE'
      ? `Hello ${name},\n\nYou have been invited to join the Savvey Savers Platform.\n\nClick the link below to set your password and access your dashboard:\n${activationLink}\n\nBest regards,\nSavvey Savers Team`
      : `Hello ${name},\n\nYour account has been registered by the administrator. We will contact you when your dashboard access is ready.\n\nBest regards,\nSavvey Savers Team`;

    if (foundTpl && foundTpl.enabled !== false) {
      emailSubject = foundTpl.subject || emailSubject;
      emailBody = foundTpl.body || emailBody;

      // Replace template variables
      const replacements: Record<string, string> = {
        name,
        memberName: name,
        invitedUser: name,
        first_name: firstName || name.split(' ')[0] || '',
        last_name: lastName || name.split(' ').slice(1).join(' ') || '',
        email: normalizedEmail,
        reacturl: activationLink,
        url: activationLink,
        loginUrl: activationLink,
      };

      Object.entries(replacements).forEach(([key, val]) => {
        const reg = new RegExp(`\\{${key}\\}`, 'g');
        emailBody = emailBody.replace(reg, val);
        emailSubject = emailSubject.replace(reg, val);
      });
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
      const emailBody = `Hello ${user.name},\n\nYou have been invited to join the Savvey Savers Platform.\n\nClick the link below to set your password and access your dashboard:\n${activationLink}\n\nThis link is active for 72 hours.\n\nBest regards,\nSavvey Savers Team`;

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
        const host = request.headers.get('host') || 'savvey-savers.vercel.app';
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const origin = `${protocol}://${host}`;
        
        resetLink = await adminAuth.generatePasswordResetLink(user.email, {
          url: `${origin}/`
        });
      } catch (authErr: any) {
        console.error('Firebase Admin generatePasswordResetLink error:', authErr);
        let errorMsg = authErr.message || 'Unable to generate reset link.';
        if (errorMsg.includes('Unable to create the email action link') || errorMsg.includes('INTERNAL ASSERT FAILED')) {
          errorMsg = 'Unable to generate password reset link. Please ensure that "Email/Password" sign-in provider is enabled in your Firebase Console under Authentication > Sign-in method, and that your domain is whitelisted in "Authorized domains" under Settings.';
        }
        return NextResponse.json({ error: `Firebase Auth configuration issue: ${errorMsg}` }, { status: 500 });
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
    let isRoleChanging = false;

    if ('isActive' in body) {
      updateData.isActive = !!body.isActive;
    } else if ('membershipFeeConfirmed' in body) {
      updateData.membershipFeeConfirmed = !!body.membershipFeeConfirmed;
      updateData.membershipFeeConfirmedAt = body.membershipFeeConfirmed ? new Date().toISOString() : null;
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
        permissions,
        approveRequest
      } = body;

      isRoleChanging = role && role !== user.role;

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
      if (isSuperAdmin === true || role === 'SUPER_ADMIN') {
        const reqUser = await checkAdmin();
        const isReqSuperAdmin = reqUser && (reqUser.isSuperAdmin === true || reqUser.id === 'usr_admin');

        if (!isReqSuperAdmin && !approveRequest) {
          // If non-super admin requests to make user a Super Admin:
          // Send request email to Super Admin for confirmation
          const allUsers = await db.users.findMany();
          const superAdminUser = allUsers.find(u => u.isSuperAdmin === true || u.id === 'usr_admin');
          const superAdminEmail = superAdminUser?.email || 'savveysaverscollective@gmail.com';
          const approvalLink = `https://savvey-savers.vercel.app/dashboard/users?approveSuperAdmin=${user.id}`;

          await sendEmail({
            to: superAdminEmail,
            subject: 'Super Admin Access Request - Confirmation Required',
            body: `Hello Super Admin,\n\nAn administrator (${reqUser?.name || 'Admin'}) has requested to promote user ${user.name} (${user.email}) to Super Admin role.\n\nPlease click the link below to accept and approve this request:\n${approvalLink}\n\nBest regards,\nSavvey Savers Platform`
          });

          await db.notifications.create({
            userId: superAdminUser?.id || 'usr_admin',
            message: `Admin ${reqUser?.name || 'Admin'} requested Super Admin promotion for ${user.name}.`,
            type: 'SUPER_ADMIN_REQUEST',
            targetUserId: user.id,
            link: approvalLink,
            isRead: false
          });

          return NextResponse.json({
            success: true,
            pendingSuperAdmin: true,
            message: `Super Admin request submitted! An email confirmation with an approval link has been sent to the Super Admin (${superAdminEmail}).`
          });
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
        updateData.role = 'ADMIN';
      }
    }

    await db.users.update({
      where: { id },
      data: updateData
    });

    if (isRoleChanging) {
      const targetRoleName = body.role === 'ADMIN' ? 'Coordinator' : 'Saver';
      await sendEmail({
        to: updateData.email || user.email,
        subject: 'Savvey Savers - Role Updated',
        body: `Hello ${updateData.name || user.name},\n\nYour role on the Savvey Savers Platform has been updated to ${targetRoleName}.\n\nBest regards,\nSavvey Savers Team`
      });
      console.log(`Role update notification email sent to ${user.email} (New Role: ${targetRoleName}).`);
    }

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
  const reqUser = await checkAdmin();
  if (!reqUser) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  // Check if requesting user has DELETE_USER permission or is Super Admin
  const isReqSuperAdmin = reqUser.isSuperAdmin === true || reqUser.id === 'usr_admin';
  const hasDeletePerm = isReqSuperAdmin || (reqUser.permissions && reqUser.permissions.includes('DELETE_USER'));

  if (!hasDeletePerm) {
    return NextResponse.json(
      { error: 'Permission Denied: You do not have the Delete User permission enabled on your administrator account.' },
      { status: 403 }
    );
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

      // Check if the user is a super admin
      const isSuperAdmin = user.isSuperAdmin === true || (user.id === 'usr_admin' && user.isSuperAdmin !== false);
      if (isSuperAdmin) {
        errors.push(`The Super Admin account (${user.name}) cannot be deleted.`);
        continue;
      }

      // Check if user has ANY savings commitment - disallow deletion
      const userCommitments = await db.commitments.findMany((c) => c.memberId === id);
      if (userCommitments.length > 0) {
        return NextResponse.json(
          { error: "This user have a already a saving commitment" },
          { status: 400 }
        );
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
