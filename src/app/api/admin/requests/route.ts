import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
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

  // Get requests (Admins get all, Members get own)
  let requests = [];
  if (session.role === 'ADMIN') {
    requests = await db.submittedRequests.findMany();
  } else {
    requests = await db.submittedRequests.findMany((r) => r.userId === session.id);
  }

  const allUsers = await db.users.findMany();
  const allCommitments = await db.commitments.findMany();

  // Join data
  const formatted = requests.map((r) => {
    const user = allUsers.find((u) => u.id === r.userId);
    const cmt = allCommitments.find((c) => c.id === r.commitmentId);
    return {
      ...r,
      saverName: user ? user.name : 'Unknown Saver',
      savingsGoal: cmt ? cmt.goal : 'N/A',
      amount: cmt ? cmt.amount : 0
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required.' }, { status: 400 });
    }

    const req = await db.submittedRequests.findUnique({ where: { id: requestId } });
    if (!req) {
      return NextResponse.json({ error: 'Request record not found.' }, { status: 404 });
    }

    const cmt = await db.commitments.findUnique({ where: { id: req.commitmentId } });
    const member = await db.users.findUnique({ where: { id: req.userId } });

    if (action === 'APPROVE') {
      // Update request status
      await db.submittedRequests.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });

      // Activate the related commitment
      if (cmt) {
        await db.commitments.update({
          where: { id: cmt.id },
          data: { status: 'ACTIVE' }
        });
      }

      if (member && cmt) {
        // Send email
        await sendEmail({
          to: member.email,
          subject: 'Savvey Savers - Collection Month Approved!',
          body: `Hello ${member.name},\n\nGood news! Your request for collection month ${req.requestedMonth} ${req.requestedYear} (Savings target: ${cmt.goal}) has been officially APPROVED by the group coordinator.\n\nYour rotating savings cycle is now active.\n\nBest regards,\nSavvey Savers Team`
        });

        // Notification
        await db.notifications.create({
          userId: member.id,
          message: `Your requested collection month ${req.requestedMonth} ${req.requestedYear} has been approved.`,
          type: 'REQUEST_APPROVED',
          isRead: false
        });
      }

      await db.auditLogs.create({
        action: 'REQUEST_APPROVE',
        details: `Approved collection request ${requestId} for member ${req.userId}.`,
        userId: session.id
      });

    } else if (action === 'REJECT') {
      // Update request status
      await db.submittedRequests.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });

      // Set commitment to cancelled
      if (cmt) {
        await db.commitments.update({
          where: { id: cmt.id },
          data: { status: 'CANCELLED' }
        });
      }

      if (member && cmt) {
        // Send email
        await sendEmail({
          to: member.email,
          subject: 'Savvey Savers - Collection Month Request Update',
          body: `Hello ${member.name},\n\nYour request for collection month ${req.requestedMonth} ${req.requestedYear} has been declined by the group coordinator.\n\nPlease contact your coordinator to select an alternative month.\n\nBest regards,\nSavvey Savers Team`
        });

        // Notification
        await db.notifications.create({
          userId: member.id,
          message: `Your request for collection month ${req.requestedMonth} ${req.requestedYear} has been declined.`,
          type: 'REQUEST_REJECTED',
          isRead: false
        });
      }

      await db.auditLogs.create({
        action: 'REQUEST_REJECT',
        details: `Declined collection request ${requestId} for member ${req.userId}.`,
        userId: session.id
      });
    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Request status change error:', err);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
