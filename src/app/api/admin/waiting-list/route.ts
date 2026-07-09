import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

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

  const entries = (await db.waitingList.findMany()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { waitingListId, inviteMode } = await request.json();

    if (!waitingListId || !inviteMode) {
      return NextResponse.json({ error: 'Waiting list ID and invite mode are required.' }, { status: 400 });
    }

    const entry = await db.waitingList.findUnique({ where: { id: waitingListId } });
    if (!entry) {
      return NextResponse.json({ error: 'Waiting list entry not found.' }, { status: 404 });
    }

    // Verify duplicate email in users
    const existingUser = await db.users.findFirst((u) => u.email.toLowerCase() === entry.email.toLowerCase());
    if (existingUser) {
      // Clean up waiting list and error out
      await db.waitingList.delete({ where: { id: waitingListId } });
      return NextResponse.json({ error: 'This prospect email is already registered as a member.' }, { status: 400 });
    }

    // 1. Create invitation fields
    const invitationId = 'invite_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    // 2. Create User
    const newUser = await db.users.create({
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      role: 'MEMBER',
      membership: 'Standard Saver',
      isActive: false,
      passwordHash: 'pending_activation',
      invitationId,
      invitationExpiresAt
    });

    // 3. Create active commitment based on intended amount
    await db.commitments.create({
      memberId: newUser.id,
      amount: entry.monthlySavingsCommitment,
      goal: 'Savings',
      collectionMonth: 'December',
      collectionYear: new Date().getFullYear(),
      endDate: `${new Date().getFullYear()}-12-31`,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString()
    });

    // 4. Send email
    const host = request.headers.get('host') || 'savvey-savers.vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;
    const activationLink = `${origin}/activate?invite=${invitationId}`;
    let emailSubject = '';
    let emailBody = '';

    if (inviteMode === 'SAVE_INVITE') {
      emailSubject = 'Welcome to Savvey Savers - Invitation to Join';
      emailBody = `Hello ${entry.name},\n\nCongratulations! Your application to join the Savvey Savers group has been approved.\n\nClick the link below to set your password and access your dashboard:\n${activationLink}\n\nThis link is active for 72 hours.\n\nBest regards,\nSavvey Savers Team`;
    } else {
      emailSubject = 'Welcome to Savvey Savers - Account Registered';
      emailBody = `Hello ${entry.name},\n\nYour application to join the Savvey Savers group has been approved and registered. We will contact you when your dashboard access is ready.\n\nBest regards,\nSavvey Savers Team`;
    }

    await sendEmail({
      to: entry.email,
      subject: emailSubject,
      body: emailBody
    });

    // Remove prospect from waiting list
    await db.waitingList.delete({ where: { id: waitingListId } });

    // Admin notification
    await db.notifications.create({
      userId: 'usr_admin',
      message: `Prospect ${entry.name} converted to member successfully in mode ${inviteMode}.`,
      type: 'PROSPECT_CONVERTED',
      isRead: false
    });

    // Audit log
    await db.auditLogs.create({
      action: 'ADMIN_PROSPECT_APPROVE',
      details: `Admin approved waiting list entry for ${entry.name} (${entry.email}) and created user.`,
      userId: 'usr_admin'
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Approve prospect error:', err);
    return NextResponse.json({ error: 'Failed to convert prospect.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    const entry = await db.waitingList.findUnique({ where: { id } });
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    }

    // Delete prospect
    await db.waitingList.delete({ where: { id } });

    // Audit log
    await db.auditLogs.create({
      action: 'ADMIN_PROSPECT_DECLINE',
      details: `Admin declined waiting list entry for ${entry.name} (${entry.email}).`,
      userId: 'usr_admin'
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Decline prospect error:', err);
    return NextResponse.json({ error: 'Failed to decline prospect.' }, { status: 500 });
  }
}
