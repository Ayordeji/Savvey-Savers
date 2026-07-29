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
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  const adminId = payload?.id || 'admin';

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
    const existingUser = await db.user.findFirst({ where: { email: entry.email } });
    if (existingUser) {
      // Clean up waiting list and error out
      await db.waitingList.delete({ where: { id: waitingListId } });
      return NextResponse.json({ error: 'This prospect email is already registered as a member.' }, { status: 400 });
    }

    // 1. Create invitation fields
    const invitationId = 'invite_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    // Generate sequential M-XXXXXX ID
    const existingUsers = await db.user.findMany({ select: { id: true, displayId: true } });
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
    const userDisplayId = `M-${nextIdStr}`;

    // 2. Create User
    const newUser = await db.user.create({ data: {
      id: userDisplayId,
      displayId: userDisplayId,
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      role: 'MEMBER',
      isActive: true,
      membership: 'STANDARD',
      invitationId,
      invitationExpiresAt,
      membershipFeeConfirmed: false,
      termsAccepted: false
    } });

    // 3. Create active commitment based on their waiting list promise
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const isPast15th = currentDate.getDate() > 15;
    
    // Determine the collection month/year
    let collectionMonthName = currentMonth;
    let collectionYear = currentYear;
    
    if (isPast15th) {
      // Shift to next month
      const nextMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      collectionMonthName = nextMonthDate.toLocaleString('default', { month: 'long' });
      collectionYear = nextMonthDate.getFullYear();
    }

    // Determine goal and set end date based on mode
    let goal = 'Standard Savings';
    let endDate = null;
    
    if (inviteMode === 'yearly') {
       goal = 'Yearly Savings (12 Months)';
       endDate = new Date(currentYear + 1, currentDate.getMonth(), currentDate.getDate()); // +1 year
    } else if (inviteMode === 'monthly') {
       goal = 'Monthly Flexible Savings';
    } else {
       goal = 'Indefinite Savings';
    }

    // Generate sequential SC-XXXXX displayId
    const existingCommitments = await db.commitment.findMany({
      select: { id: true, displayId: true }
    });
    let maxScNum = 0;
    for (const ec of existingCommitments) {
      if (ec.displayId && /^SC-\d+$/.test(ec.displayId)) {
        const num = parseInt(ec.displayId.replace(/^SC-0*/, '') || '0', 10);
        if (num > maxScNum) maxScNum = num;
      }
      if (ec.id && /^SC-\d+$/.test(ec.id)) {
        const num = parseInt(ec.id.replace(/^SC-0*/, '') || '0', 10);
        if (num > maxScNum) maxScNum = num;
      }
    }
    const nextScId = `SC-${String(maxScNum + 1).padStart(5, '0')}`;

    await db.commitment.create({
       data: {
         id: nextScId,
         displayId: nextScId,
         memberId: newUser.id,
         memberName: newUser.name,
         amount: entry.monthlySavingsCommitment,
         goal,
         collectionMonth: collectionMonthName,
         collectionYear: collectionYear,
         endDate: endDate,
         status: 'ACTIVE'
       }
    });

    // Remove prospect from waiting list
    await db.waitingList.delete({ where: { id: waitingListId } });

    // Admin notification
    await db.notification.create({ data: {
      userId: adminId,
      message: `Prospect ${entry.name} converted to member successfully in mode ${inviteMode}.`,
      type: 'PROSPECT_CONVERTED',
      isRead: false
    } });

    // Audit log
    await db.auditLog.create({ data: {
      action: 'ADMIN_PROSPECT_APPROVE',
      details: `Admin approved waiting list entry for ${entry.name} (${entry.email}) and created user.`,
      userId: adminId
    } });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Approve prospect error:', err);
    return NextResponse.json({ error: 'Failed to convert prospect.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  const adminId = payload?.id || 'admin';

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
    await db.auditLog.create({ data: {
      action: 'ADMIN_PROSPECT_DECLINE',
      details: `Admin declined waiting list entry for ${entry.name} (${entry.email}).`,
      userId: adminId
    } });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Decline prospect error:', err);
    return NextResponse.json({ error: 'Failed to decline prospect.' }, { status: 500 });
  }
}
