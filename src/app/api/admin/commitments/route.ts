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
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get commitments
    let commitments = [];
    if (session.role === 'ADMIN') {
      commitments = await db.commitment.findMany({
        include: { payments: true }
      });
    } else {
      // Member: own commitments only
      const dbUser = (await db.user.findUnique({ where: { id: session.id } })) ||
        (session.email ? await db.user.findUnique({ where: { email: session.email } }) : null);

      const userKeys = Array.from(new Set([
        session.id,
        session.email,
        dbUser?.id,
        dbUser?.displayId,
        dbUser?.email
      ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0)));

      const orConditions: any[] = userKeys.map(k => ({ memberId: k }));
      if (dbUser?.name) {
        orConditions.push({ memberName: dbUser.name });
      }

      commitments = await db.commitment.findMany({ 
        where: {
          OR: orConditions.length > 0 ? orConditions : [{ memberId: session.id }]
        },
        include: { payments: true }
      });
    }

  const currentYear = new Date().getFullYear();

  // Find the highest existing SC- number across all commitments
  let maxScNum = 0;
  for (const c of commitments) {
    const did = (c as any).displayId;
    const legacyId = c.id;
    
    // Check displayId
    if (did && /^SC-\d+$/.test(did)) {
      const n = parseInt(did.replace(/^SC-0*/, '') || '0', 10);
      if (n > maxScNum) maxScNum = n;
    }
    
    // Check legacy ID which might be SC-xxx
    if (legacyId && /^SC-\d+$/.test(legacyId)) {
      const n = parseInt(legacyId.replace(/^SC-0*/, '') || '0', 10);
      if (n > maxScNum) maxScNum = n;
    }
  }

  // Sort commitments by createdAt so sequential IDs are stable
  const sorted = [...commitments].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Assign temporary SC- IDs to commitments missing them (in memory + async DB persist)
  const toBackfill: { id: string; displayId: string }[] = [];
  for (const c of sorted) {
    const did = (c as any).displayId;
    const legacyId = c.id;
    const hasValidSc = (did && /^SC-\d+$/.test(did)) || (legacyId && /^SC-\d+$/.test(legacyId));
    
    if (!hasValidSc) {
      maxScNum++;
      const newDisplayId = `SC-${String(maxScNum).padStart(5, '0')}`;
      (c as any).displayId = newDisplayId;
      toBackfill.push({ id: c.id, displayId: newDisplayId });
    }
  }

  // Persist missing SC- IDs back to DB sequentially to avoid exhausting the 1-conn pool
  if (toBackfill.length > 0) {
    (async () => {
      for (const { id, displayId } of toBackfill) {
        try {
          await db.commitment.update({ where: { id }, data: { displayId } });
        } catch (e) {}
      }
    })();
  }

  // Join member name & evaluate status based on cycle length
  const formatted = commitments.map((c) => {
    const member = allUsers.find((u) =>
      u.id === c.memberId ||
      (u.invitationId && c.memberId && u.invitationId.toLowerCase() === c.memberId.toLowerCase()) ||
      (u.name && c.memberName && u.name.toLowerCase().trim() === c.memberName.toLowerCase().trim())
    );

    const displayId = (c as any).displayId || (c.id && /^SC-\d+$/.test(c.id) ? c.id : c.id);

    // Status driven by cycle year
    let status = c.status;
    if (status !== 'CANCELLED') {
      if (c.collectionYear < currentYear) {
        status = 'COMPLETED';
      } else if (c.collectionYear > currentYear) {
        status = 'NOT_YET_STARTED';
      } else if (!status || status === 'COMPLETED' || status === 'NOT_YET_STARTED') {
        status = 'ACTIVE';
      }
    }

    const nameToUse = (c.memberName && c.memberName !== 'Unknown Member' && c.memberName.trim().length > 0)
      ? c.memberName
      : (member ? member.name : 'Unknown Member');

    return {
      ...c,
      id: c.id, // NEVER overwrite the primary key
      displayId, // Provide displayId explicitly
      status,
      memberName: nameToUse
    };
  });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Error fetching commitments:', err);
    return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { memberId, amount, goal, collectionMonth, collectionYear, endDate, requestCollection } = await request.json();

    // Verify member permissions
    // Members can only create commitments for themselves
    const targetMemberId = session.role === 'ADMIN' ? memberId : session.id;

    // Removed manual memberId regex validation. Prisma findUnique handles invalid formats safely.

    if (!targetMemberId || !amount || !goal) {
      return NextResponse.json({ error: 'Member, goal, and amount are required.' }, { status: 400 });
    }

    const member = await db.user.findUnique({ where: { id: targetMemberId } });
    if (!member) {
      return NextResponse.json({ error: 'Target member not found.' }, { status: 404 });
    }

    if (!member.membershipFeeConfirmed) {
      return NextResponse.json({ error: 'Membership payment has not yet been confirmed.' }, { status: 403 });
    }

    const startMonth = collectionMonth || 'January';
    const startYear = parseInt(collectionYear) || new Date().getFullYear();

    const currentYear = new Date().getFullYear();
    let status = 'ACTIVE';
    if (startYear < currentYear) {
      status = 'COMPLETED';
    } else if (startYear > currentYear) {
      status = 'NOT_YET_STARTED';
    } else if (requestCollection) {
      status = 'PENDING';
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

    const newCommitment = await db.commitment.create({ data: {
      id: nextScId,
      displayId: nextScId,
      memberId: targetMemberId,
      amount: parseFloat(amount),
      goal,
      collectionMonth: startMonth,
      collectionYear: startYear,
      endDate: endDate ? new Date(endDate) : new Date(startYear, 11, 31),
      status,
      memberName: member.name || ''
    } });

    // Create related payments placeholder for the collection month
    await db.payment.create({ data: {
      commitmentId: newCommitment.id,
      userId: targetMemberId,
      amount: newCommitment.amount,
      month: startMonth,
      year: startYear,
      status: 'PENDING'
    } });

    if (requestCollection) {
      // Create Submitted Request entry
      const req = await db.submittedRequest.create({ data: {
        userId: targetMemberId,
        commitmentId: newCommitment.id,
        requestedMonth: startMonth,
        requestedYear: startYear,
        status: 'PENDING'
      } });

      // Generate notifications for Admins
      const admins = await db.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await db.notification.create({ data: {
          userId: admin.id,
          message: `Collection month requested by ${member.name} for ${startMonth} ${startYear}.`,
          type: 'COLLECTION_REQUESTED',
          isRead: false
        } });
      }

      // Member personal notification
      await db.notification.create({ data: {
        userId: member.id,
        message: `Your request for collection month ${startMonth} ${startYear} is submitted and pending approval.`,
        type: 'COLLECTION_REQUESTED',
        isRead: false
      } });
    } else {
      // Standard active notification
      await db.notification.create({ data: {
        userId: member.id,
        message: `New savings commitment of £${amount} created for ${goal}.`,
        type: 'COMMITMENT_CREATED',
        isRead: false
      } });
    }

    // Audit log
    await db.auditLog.create({ data: {
      action: 'COMMITMENT_ADD',
      details: `Savings commitment for ${member.name} (£${amount}/mo for ${goal}) created. Request collection: ${requestCollection}.`,
      userId: session.id
    } });

    return NextResponse.json({ success: true, commitment: newCommitment });

  } catch (err: any) {
    console.error('Create commitment error:', err);
    const errMsg = err?.message || '';
    if (errMsg.includes('EMAXCONNSESSION') || errMsg.toLowerCase().includes('timeout') || errMsg.includes('Connection terminated')) {
      return NextResponse.json({ error: 'Database connection limit reached. Please try again in a few seconds.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create commitment.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Admin only edit details
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, amount, goal, collectionMonth, collectionYear, status } = await request.json();

    const cmt = await db.commitment.findUnique({ where: { id } });
    if (!cmt) {
      return NextResponse.json({ error: 'Commitment not found.' }, { status: 404 });
    }

    // Update
    await db.commitment.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : cmt.amount,
        goal: goal || cmt.goal,
        collectionMonth: collectionMonth || cmt.collectionMonth,
        collectionYear: collectionYear ? parseInt(collectionYear) : cmt.collectionYear,
        status: status || cmt.status
      }
    });

    await db.auditLog.create({ data: {
      action: 'ADMIN_COMMITMENT_UPDATE',
      details: `Admin updated savings commitment record ${id}.`,
      userId: session.id || session?.id
    } });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Update commitment error:', err);
    return NextResponse.json({ error: 'Failed to update commitment.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // Admin only cancel/delete commitment
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id') || searchParams.get('ids');

    if (!idParam) {
      return NextResponse.json({ error: 'Commitment ID(s) are required.' }, { status: 400 });
    }

    const ids = idParam.split(',').map((id) => id.trim()).filter(Boolean);

    for (const rawId of ids) {
      // Find the commitment. We query all to bypass Prisma's strict UUID validation
      // if rawId happens to be a displayId like 'SC-00001'.
      const all = await db.commitment.findMany();
      
      let resolvedId = rawId;
      if (rawId.startsWith('SCC-')) {
        const legacyId = `cmt_${rawId.substring(4)}`;
        if (all.some((c: any) => c.id === legacyId)) {
          resolvedId = legacyId;
        }
      }

      const found = all.find((c: any) => c.id === rawId || c.displayId === rawId || c.id === resolvedId || c.displayId === resolvedId);
      
      if (!found) continue;

      const finalCmt = found;
      resolvedId = found.id; // use the actual UUID for DB updates

      if (finalCmt.status === 'CANCELLED') {
        // Hard delete
        await db.commitment.delete({
          where: { id: resolvedId }
        });
        
        await db.auditLog.create({ data: {
          action: 'ADMIN_COMMITMENT_DELETE',
          details: `Admin permanently deleted savings commitment ${resolvedId} for member ${finalCmt.memberId}.`,
          userId: session.id
        } });
      } else {
        // Archive by setting status to CANCELLED instead of deleting permanently
        await db.commitment.update({ 
          where: { id: resolvedId },
          data: { status: 'CANCELLED' }
        });

        await db.auditLog.create({ data: {
          action: 'ADMIN_COMMITMENT_CANCEL',
          details: `Admin cancelled and archived savings commitment ${resolvedId} for member ${finalCmt.memberId}.`,
          userId: session.id
        } });
      }

      // Admin Notification
      await db.notification.create({ data: {
        userId: session.id,
        message: `You successfully cancelled the commitment for member ID ${finalCmt.memberId} (Commitment ID: ${resolvedId}).`,
        type: 'SYSTEM',
        isRead: false
      } });
    }

    return NextResponse.json({ success: true, count: ids.length });

  } catch (err: any) {
    console.error('Delete commitment error:', err);
    return NextResponse.json({ error: `Failed to archive commitment. Details: ${err.message || String(err)}` }, { status: 500 });
  }
}
