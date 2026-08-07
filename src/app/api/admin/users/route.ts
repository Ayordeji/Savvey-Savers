import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, sendTemplatedEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';



async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

async function checkAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  let user = await db.user.findUnique({ where: { id: payload.id } });
  if (!user && payload.email) {
    user = await db.user.findUnique({ where: { email: payload.email } });
  }
  return user;
}

async function checkAdmin() {
  const user = await checkAdminUser();
  return user;
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let rawUsers;

  if (session.role === 'ADMIN') {
    // Admins get everyone
    rawUsers = await db.user.findMany({
      include: { membershipFeeRecords: true }
    });
  } else {
    // Members only get themselves and their direct referrals
    const dbUser = (await db.user.findUnique({ where: { id: session.id } })) ||
      (session.email ? await db.user.findUnique({ where: { email: session.email } }) : null);

    const userKeys = Array.from(new Set([
      session.id,
      session.email,
      dbUser?.id,
      dbUser?.displayId,
      dbUser?.invitationId,
      dbUser?.email
    ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0)));

    const orConditions: any[] = [{ id: session.id }];
    if (dbUser?.id) orConditions.push({ id: dbUser.id });
    userKeys.forEach(k => orConditions.push({ invitedBy: k }));

    rawUsers = await db.user.findMany({
      where: {
        OR: orConditions
      },
      include: { membershipFeeRecords: true }
    });
  }

  // Strict deduplication by email & invitationId to eliminate duplicates
  const uniqueUserMap = new Map<string, any>();
  for (const u of rawUsers) {
    if (!u || u.id === 'usr_admin') continue;
    const emailKey = u.email ? u.email.toLowerCase().trim() : '';
    const memberKey = u.invitationId ? u.invitationId.trim() : '';
    const primaryKey = emailKey || memberKey || u.id;

    if (!uniqueUserMap.has(primaryKey)) {
      uniqueUserMap.set(primaryKey, u);
    } else {
      const existing = uniqueUserMap.get(primaryKey);
      // Keep super admin or admin privileges if merge occurs
      if (u.isSuperAdmin || u.role === 'ADMIN') {
        uniqueUserMap.set(primaryKey, { ...existing, ...u });
      }
    }
  }
  const allUsers = Array.from(uniqueUserMap.values());

  // Sort by createdAt ascending to assign stable sequential display IDs
  const sortedUsers = [...allUsers].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  const users = sortedUsers.map(u => {
    return {
      id: u.id,
      displayId: u.displayId || u.id,
      isSuperAdmin: u.isSuperAdmin === true || (u.id === 'usr_admin' && u.isSuperAdmin !== false),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      membership: u.membership,
      membershipFeeConfirmed: u.membershipFeeConfirmed,
      membershipFeeConfirmedAt: u.membershipFeeConfirmedAt || null,
      hasPendingFee: u.membershipFeeRecords?.some((r: any) => r.status === 'PENDING') || false,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      invitationId: u.invitationId,
      invitationExpiresAt: u.invitationExpiresAt,
      addressLine1: u.addressLine1,
      addressLine2: u.addressLine2,
      city: u.city,
      postCode: u.postCode,
      country: u.country,
      permissions: u.permissions,
      invitedBy: u.invitedBy
    };
  });

  // Reverse so newest users appear at the top of the dashboard, matching the QA site layout
  const newestFirstUsers = [...users].reverse();

  return NextResponse.json(newestFirstUsers);
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const isMemberInvite = session.role !== 'ADMIN';

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
      permissions,
      commitmentAmount,
      collectionMonth,
      collectionYear
    } = body;

    const name = firstName ? `${firstName} ${lastName || ''}`.trim() : (body.name || '');

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone number are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check email uniqueness
    const existing = await db.user.findFirst({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    // Generate sequential M-XXXXXX ID using displayId and id
    const existingUsers = await db.user.findMany({
      select: { id: true, displayId: true }
    });
    let maxId = 0;
    for (const u of existingUsers) {
      if (u.displayId && /^M-\d+$/.test(u.displayId)) {
        const num = parseInt(u.displayId.substring(2), 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
      if (u.id && /^M-\d+$/.test(u.id)) {
        const num = parseInt(u.id.substring(2), 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    }
    const nextIdStr = String(maxId + 1).padStart(6, '0');
    const displayId = `M-${nextIdStr}`;
    const invitationId = `invite_${Math.random().toString(36).substring(2, 15)}`;
    const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

    // Create user in Database
    const newUser = await db.user.create({ data: {
      id: displayId,
      name,
      firstName: firstName || name.split(' ')[0] || '',
      lastName: lastName || name.split(' ').slice(1).join(' ') || '',
      email: normalizedEmail,
      phone,
      role: role || 'MEMBER',
      membership: membership || 'Standard Saver',
      isActive: !isMemberInvite, // Inactive / pending approval if invited by a member
      passwordHash: 'pending_activation',
      displayId,
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
    } });

    // Create commitment if specified
    if (commitmentAmount && parseFloat(commitmentAmount) > 0) {
      const amtNum = parseFloat(commitmentAmount);
      await db.commitment.create({ data: {
        memberId: newUser.id,
        memberName: name,
        
        amount: amtNum,
        goal: `Savings Goal (£${amtNum}/mo)`,
        collectionMonth: collectionMonth || 'January',
        collectionYear: parseInt(collectionYear) || new Date().getFullYear(),
        status: isMemberInvite ? 'PENDING' : 'ACTIVE',
        createdAt: new Date().toISOString()
      } });
    }

    if (isMemberInvite) {
      // Notify Admins about member invitation pending approval
      const inviter = await db.user.findUnique({ where: { id: session.id } });
      const inviterName = inviter ? inviter.name : 'A member';
      const admins = await db.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await db.notification.create({ data: {
          userId: admin.id,
          message: `${inviterName} has submitted a new member invitation for ${name} (${normalizedEmail}) - Pending Admin Approval.`,
          type: 'MEMBER_INVITATION_SUBMITTED',
          isRead: false
        } });
      }

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'Member invitation submitted successfully! Pending Admin approval.',
        user: newUser
      });
    }

    // Handle email triggering using template settings
    const host = request.headers.get('host') || 'savvey-savers.vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;
    const activationLink = `${origin}/activate?invite=${invitationId}`;

    await sendTemplatedEmail("2", normalizedEmail, {
      name,
      memberName: name,
      invitedUser: name,
      first_name: firstName || name.split(' ')[0] || '',
      last_name: lastName || name.split(' ').slice(1).join(' ') || '',
      email: normalizedEmail,
      reacturl: activationLink,
      url: activationLink,
      loginUrl: activationLink,
    });

    // Create admin notification
    await db.notification.create({ data: {
      userId: session.id || session?.id,
      message: `User ${name} added successfully. Email invite status: ${inviteMode}.`,
      type: 'USER_ADDED',
      isRead: false
    } });

    // Audit log
    await db.auditLog.create({ data: {
      action: 'ADMIN_USER_ADD',
      details: `Admin added user ${name} (${normalizedEmail}) in mode ${inviteMode}.`,
      userId: session.id || session?.id
    } });

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
  const reqUser = await checkAdmin();
  if (!reqUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (body.action === 'send_invite' || body.action === 'send_reset') {
      const invitationId = (body.action === 'send_reset' ? 'reset_' : 'invite_') + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      await db.user.update({
        where: { id },
        data: { invitationId, invitationExpiresAt }
      });

      const host = request.headers.get('host') || 'savvey-savers.vercel.app';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const origin = `${protocol}://${host}`;
      const link = body.action === 'send_reset' 
        ? `${origin}/reset-password?token=${invitationId}` 
        : `${origin}/activate?invite=${invitationId}`;

      const templateId = body.action === 'send_reset' ? '1' : '2';
      const mailRes = await sendTemplatedEmail(templateId, user.email, {
        name: user.name,
        memberName: user.name,
        first_name: user.firstName || user.name.split(' ')[0] || '',
        last_name: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        reacturl: link,
        url: link,
        loginUrl: link,
      });

      if (!mailRes.success) {
        return NextResponse.json({ error: `Failed to send email: ${'error' in mailRes ? mailRes.error : 'Unknown error'}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: body.action === 'send_reset' ? 'Password reset link sent.' : 'Invitation email resent successfully.'
      });
    }

    let updateData: any = {};
    let isRoleChanging = false;

    if ('isActive' in body) {
      const newActiveState = !!body.isActive;
      updateData.isActive = newActiveState;
      if (!newActiveState) {
        updateData.deactivationReason = body.deactivationReason || 'Inactive Member / User';
      }

      // Handle email notification on activation/deactivation
      if (!newActiveState) {
        // Deactivation email logic
        const reason = body.deactivationReason || '';
        let tplId = '32'; // Default: Inactive Member
        if (reason === 'Breach of Membership Terms') {
          tplId = '30';
        } else if (reason === 'Member left the Network') {
          tplId = '31';
        }

        await sendTemplatedEmail(tplId, user.email, {
          name: user.name,
          MemberName: user.name,
          first_name: user.firstName || user.name.split(' ')[0] || user.name,
          last_name: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
          email: user.email,
        });
      } else {
        // Reactivation email logic
        const subject = 'Account Reactivated - Savvey Savers Network';
        const bodyText = `Dear ${user.firstName || user.name.split(' ')[0] || user.name},\n\nYour account on the Savvey Savers Network has been reactivated by your Administrator. You can now log into your dashboard using your credentials.\n\nKind regards,\nPlatform Support\nSavvey Savers Network`;
        
        await sendEmail({
          to: user.email,
          subject,
          body: bodyText
        });
      }
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

      if (!approveRequest && (!email || !phone)) {
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
        email: email ? email.toLowerCase().trim() : user.email,
        phone: phone || user.phone,
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
        // We already have reqUser from the top of the function
        const isReqSuperAdmin = reqUser && (reqUser.isSuperAdmin === true || reqUser.id === 'usr_admin');

        if (!isReqSuperAdmin && !approveRequest) {
          // If non-super admin requests to make user a Super Admin:
          // Send request email to Super Admin for confirmation
          const allUsers = await db.user.findMany();
          const superAdminUser = allUsers.find(u => u.isSuperAdmin === true || u.id === 'usr_admin');
          const superAdminEmail = superAdminUser?.email || 'savveysaverscollective@gmail.com';
          const approvalLink = `https://savvey-savers.vercel.app/dashboard/users?approveSuperAdmin=${user.id}`;

          await sendEmail({
            to: superAdminEmail,
            subject: 'Super Admin Access Request - Confirmation Required',
            body: `Hello Super Admin,\n\nAn administrator (${reqUser?.name || 'Admin'}) has requested to promote user ${user.name} (${user.email}) to Super Admin role.\n\nPlease click the link below to accept and approve this request:\n<a href="${approvalLink}">${approvalLink}</a>\n\nBest regards,\nSavvey Savers Platform`
          });

          await db.notification.create({ data: {
            userId: superAdminUser?.id || 'usr_admin',
            message: `Admin ${reqUser?.name || 'Admin'} requested Super Admin promotion for ${user.name}.`,
            type: 'SUPER_ADMIN_REQUEST',
            
            isRead: false
          } });

          return NextResponse.json({
            success: true,
            pendingSuperAdmin: true,
            message: `Super Admin request submitted! An email confirmation with an approval link has been sent to the Super Admin (${superAdminEmail}).`
          });
        }

        const allUsers = await db.user.findMany();
        const currentSuperAdmin = allUsers.find(u => u.isSuperAdmin === true || (u.id === 'usr_admin' && u.isSuperAdmin !== false));
        if (currentSuperAdmin && currentSuperAdmin.id !== id) {
          await db.user.update({
            where: { id: currentSuperAdmin.id },
            data: { isSuperAdmin: false }
          });
          console.log(`Transferred Super Admin role from ${currentSuperAdmin.id} to ${id}.`);
        }
        updateData.isSuperAdmin = true;
        updateData.role = 'ADMIN';
      }
    }

    await db.user.update({
      where: { id },
      data: updateData
    });

    if (updateData.name && updateData.name !== user.name) {
      await db.commitment.updateMany({
        where: { memberId: id },
        data: { memberName: updateData.name }
      });
    }

    if (isRoleChanging) {
      const targetRoleName = body.role === 'ADMIN' ? 'Coordinator' : 'Saver';
      await sendEmail({
        to: updateData.email || user.email,
        subject: 'Savvey Savers - Role Updated',
        body: `Hello ${updateData.name || user.name},\n\nYour role on the Savvey Savers Platform has been updated to ${targetRoleName}.\n\nBest regards,\nSavvey Savers Team`
      });
      console.log(`Role update notification email sent to ${user.email} (New Role: ${targetRoleName}).`);
    }

    await db.auditLog.create({ data: {
      action: 'ADMIN_USER_UPDATE',
      details: `Admin updated user details for ${user.email}.`,
      userId: reqUser.id
    } });

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
      const user = await db.user.findUnique({ where: { id } });
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

      // Check if user has ANY active (non-cancelled) savings commitment - skip (don't block the whole batch)
      const userCommitments = await db.commitment.findMany({ 
        where: { memberId: id, status: { not: 'CANCELLED' } } 
      });
      if (userCommitments.length > 0) {
        errors.push(`${user.name} (${user.email}) has an active savings commitment and was skipped.`);
        continue;
      }

      // Delete user from active users in database
      await db.user.delete({ where: { id } });

      // Create DeletedRecord for the user
      await db.deletedRecord.create({
        data: {
          type: 'USER',
          originalData: JSON.parse(JSON.stringify(user))
        }
      });

      // Clean up related commitments (archive them too)
      const relatedCommitments = await db.commitment.findMany({ where: { memberId: id } });
      for (const cmt of relatedCommitments) {
        // Create DeletedRecord for each commitment
        await db.deletedRecord.create({
          data: {
            type: 'COMMITMENT',
            originalData: JSON.parse(JSON.stringify(cmt))
          }
        });
        await db.commitment.delete({ where: { id: cmt.id } });
      }

      // Audit log
      await db.auditLog.create({ data: {
        action: 'ADMIN_USER_DELETE',
        details: `Admin deleted user ${user.name} (${user.email}) and archived all records.`,
        userId: reqUser.id
      } });

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
