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
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const allUsers = await db.users.findMany();

  // Get commitments
  let commitments = [];
  if (session.role === 'ADMIN') {
    commitments = await db.commitments.findMany();
  } else {
    // Member: own commitments only
    commitments = await db.commitments.findMany((c) => c.memberId === session.id);
  }

  const currentYear = new Date().getFullYear();

  // Join member name & evaluate status based on cycle length
  const formatted = commitments.map((c) => {
    const member = allUsers.find((u) => 
      u.id === c.memberId ||
      (u.invitationId && c.memberId && u.invitationId.toLowerCase() === c.memberId.toLowerCase()) ||
      (u.name && c.memberName && u.name.toLowerCase().trim() === c.memberName.toLowerCase().trim())
    );
    
    // Auto-prefix ID with SCC- if old format
    let id = c.id;
    if (id.startsWith('cmt_')) {
      id = `SCC-${id.substring(4)}`;
    }

    // Status driven by cycle year: past year (< currentYear) = COMPLETED, coming year (> currentYear) = NOT_YET_STARTED, current year = ACTIVE
    let status = c.status;
    if (c.collectionYear < currentYear) {
      status = 'COMPLETED';
    } else if (c.collectionYear > currentYear) {
      status = 'NOT_YET_STARTED';
    } else if (!status || status === 'COMPLETED') {
      status = 'ACTIVE';
    }

    const nameToUse = (c.memberName && c.memberName !== 'Unknown Member' && c.memberName.trim().length > 0)
      ? c.memberName
      : (member ? member.name : 'Unknown Member');

    return {
      ...c,
      id,
      status,
      memberName: nameToUse
    };
  });

  return NextResponse.json(formatted);
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

    if (!targetMemberId || !amount || !goal) {
      return NextResponse.json({ error: 'Member, goal, and amount are required.' }, { status: 400 });
    }

    const member = await db.users.findUnique({ where: { id: targetMemberId } });
    if (!member) {
      return NextResponse.json({ error: 'Target member not found.' }, { status: 404 });
    }

    const startMonth = collectionMonth || 'January';
    const startYear = parseInt(collectionYear) || new Date().getFullYear();

    const currentYear = new Date().getFullYear();
    const status = startYear < currentYear ? 'COMPLETED' : (requestCollection ? 'PENDING' : 'ACTIVE');
    const newCommitment = await db.commitments.create({
      memberId: targetMemberId,
      amount: parseFloat(amount),
      goal,
      collectionMonth: startMonth,
      collectionYear: startYear,
      endDate: endDate || `${startYear}-12-31`,
      status,
      updatedAt: new Date().toISOString()
    });

    // Create related payments placeholder for the collection month
    await db.payments.create({
      commitmentId: newCommitment.id,
      amount: newCommitment.amount,
      month: startMonth,
      year: startYear,
      status: 'PENDING'
    });

    if (requestCollection) {
      // Create Submitted Request entry
      const req = await db.submittedRequests.create({
        userId: targetMemberId,
        commitmentId: newCommitment.id,
        requestedMonth: startMonth,
        requestedYear: startYear,
        status: 'PENDING'
      });

      // Generate notifications for Admins
      const admins = await db.users.findMany((u) => u.role === 'ADMIN');
      for (const admin of admins) {
        await db.notifications.create({
          userId: admin.id,
          message: `Collection month requested by ${member.name} for ${startMonth} ${startYear}.`,
          type: 'COLLECTION_REQUESTED',
          isRead: false
        });
      }

      // Member personal notification
      await db.notifications.create({
        userId: member.id,
        message: `Your request for collection month ${startMonth} ${startYear} is submitted and pending approval.`,
        type: 'COLLECTION_REQUESTED',
        isRead: false
      });
    } else {
      // Standard active notification
      await db.notifications.create({
        userId: member.id,
        message: `New savings commitment of £${amount} created for ${goal}.`,
        type: 'COMMITMENT_CREATED',
        isRead: false
      });
    }

    // Audit log
    await db.auditLogs.create({
      action: 'COMMITMENT_ADD',
      details: `Savings commitment for ${member.name} (£${amount}/mo for ${goal}) created. Request collection: ${requestCollection}.`,
      userId: session.id
    });

    return NextResponse.json({ success: true, commitment: newCommitment });

  } catch (err: any) {
    console.error('Create commitment error:', err);
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

    const cmt = await db.commitments.findUnique({ where: { id } });
    if (!cmt) {
      return NextResponse.json({ error: 'Commitment not found.' }, { status: 404 });
    }

    // Update
    await db.commitments.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : cmt.amount,
        goal: goal || cmt.goal,
        collectionMonth: collectionMonth || cmt.collectionMonth,
        collectionYear: collectionYear ? parseInt(collectionYear) : cmt.collectionYear,
        status: status || cmt.status
      }
    });

    await db.auditLogs.create({
      action: 'ADMIN_COMMITMENT_UPDATE',
      details: `Admin updated savings commitment record ${id}.`,
      userId: 'usr_admin'
    });

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
      // The GET endpoint transforms "cmt_XXXXXX" → "SCC-XXXXXX" for display.
      // Reverse that so we always find the real Firestore document.
      let resolvedId = rawId;
      if (rawId.startsWith('SCC-')) {
        const numPart = rawId.substring(4); // strip "SCC-"
        // Try cmt_ prefix first (legacy format)
        const legacyId = `cmt_${numPart}`;
        const legacyDoc = await db.commitments.findUnique({ where: { id: legacyId } });
        if (legacyDoc) {
          resolvedId = legacyId;
        }
        // else keep as SCC- (native format from our migration import)
      }

      const cmt = await db.commitments.findUnique({ where: { id: resolvedId } });
      if (!cmt) {
        // Last-ditch: scan by querying all to find by the display id field or stored id
        const all = await db.commitments.findMany();
        const found = all.find((c: any) => c.id === rawId || c.id === resolvedId);
        if (!found) continue;
        resolvedId = found.id;
      }

      const finalCmt = await db.commitments.findUnique({ where: { id: resolvedId } });
      if (!finalCmt) continue;

      const archivedData = {
        ...finalCmt,
        status: 'CANCELLED'
      };

      await db.deletedRecords.create({
        type: 'COMMITMENT',
        originalData: archivedData,
        deletedAt: new Date().toISOString()
      });

      await db.commitments.delete({ where: { id: resolvedId } });

      await db.auditLogs.create({
        action: 'ADMIN_COMMITMENT_CANCEL',
        details: `Admin deleted and archived savings commitment ${resolvedId} for member ${finalCmt.memberId}.`,
        userId: session.id || 'usr_admin'
      });
    }

    return NextResponse.json({ success: true, count: ids.length });

  } catch (err: any) {
    console.error('Delete commitment error:', err);
    return NextResponse.json({ error: 'Failed to archive commitment.' }, { status: 500 });
  }
}
