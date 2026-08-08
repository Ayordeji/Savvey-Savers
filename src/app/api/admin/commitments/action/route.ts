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

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { action, commitmentId, paymentId, month, year, amount, memberId, receiptUrl } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
    }

    // Admins only actions: Confirm Payment, Record Past Payment, Release Harvest, Send Reminder
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin action.' }, { status: 403 });
    }

    // --- Action 1: CONFIRM_PAYMENT ---
    if (action === 'CONFIRM_PAYMENT') {
      if (!paymentId && !commitmentId) {
        return NextResponse.json({ error: 'Payment ID or Commitment ID is required.' }, { status: 400 });
      }

      let payment;
      if (paymentId) {
        payment = await db.payment.findUnique({ where: { id: paymentId } });
      } else {
        payment = await db.payment.findFirst({ where: { commitmentId, status: 'PENDING' } });
      }

      if (!payment) {
        return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
      }

      const cmt = await db.commitment.findUnique({ where: { id: payment.commitmentId } });
      const member = cmt ? await db.user.findUnique({ where: { id: cmt.memberId } }) : null;

      // Update payment to CONFIRMED — the commitment stays ACTIVE
      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      });

      // NOTE: Commitment status is NOT changed here.
      // The commitment only moves to COMPLETED when the admin explicitly releases the harvest.

      if (member && cmt) {
        // Dispatch Email Notification
        const settingsRecord = await db.setting.findUnique({ where: { key: 'emailTemplates' } });
        const templates = settingsRecord?.value as any[] || [];
        await sendTemplatedEmail("22", member.email, {
          fullMonthName: payment.month,
          name: member.name
        });

        // Member Notification
        await db.notification.create({ data: {
          userId: member.id,
          message: `Your payment of £${payment.amount} for ${payment.month} ${payment.year} has been confirmed.`,
          type: 'PAYMENT_CONFIRMED',
          isRead: false
        } });
      }

      await db.auditLog.create({ data: {
        action: 'PAYMENT_CONFIRM',
        details: `Confirmed savings payment of £${payment.amount} for ${payment.month} ${payment.year}.`,
        userId: session.id
      } });

      return NextResponse.json({ success: true });
    }

    // --- Action 2: RECORD_PAST_PAYMENT ---
    if (action === 'RECORD_PAST_PAYMENT') {
      if (!commitmentId || !month || !year || !amount) {
        return NextResponse.json({ error: 'Commitment, month, year, and amount are required.' }, { status: 400 });
      }

      const cmt = await db.commitment.findUnique({ where: { id: commitmentId } });
      if (!cmt) {
        return NextResponse.json({ error: 'Commitment not found.' }, { status: 404 });
      }

      const member = await db.user.findUnique({ where: { id: cmt.memberId } });

      // Create confirmed payment
      const pastPayment = await db.payment.create({ data: {
        commitmentId,
        userId: cmt.memberId,
        amount: parseFloat(amount),
        month,
        year: parseInt(year),
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        receiptUrl: receiptUrl || null
      } });

      if (member) {
        await sendTemplatedEmail("22", member.email, {
          fullMonthName: month,
          name: member.name
        });

        // Member Notification
        await db.notification.create({ data: {
          userId: member.id,
          message: `Past contribution of £${amount} for ${month} ${year} has been recorded by the admin.`,
          type: 'PAYMENT_RECORDED',
          isRead: false
        } });
      }

      // Admin Notification
      await db.notification.create({ data: {
        userId: session.id,
        message: `You successfully recorded a past payment of £${amount} for ${member?.name || 'Unknown'} (${month} ${year}).`,
        type: 'SYSTEM',
        isRead: false
      } });

      await db.auditLog.create({ data: {
        action: 'PAST_PAYMENT_RECORD',
        details: `Recorded past payment of £${amount} for ${month} ${year} under commitment ${commitmentId}.`,
        userId: session.id
      } });

      return NextResponse.json({ success: true, payment: pastPayment });
    }

    // --- Action 3: RELEASE_HARVEST ---
    if (action === 'RELEASE_HARVEST') {
      if (!commitmentId) {
        return NextResponse.json({ error: 'Commitment ID is required.' }, { status: 400 });
      }

      const cmt = await db.commitment.findUnique({ where: { id: commitmentId } });
      if (!cmt) {
        return NextResponse.json({ error: 'Commitment not found.' }, { status: 404 });
      }

      const member = await db.user.findUnique({ where: { id: cmt.memberId } });

      // Compute total confirmed payout amount (total payments received)
      const relatedPayments = await db.payment.findMany({ where: { commitmentId, status: 'CONFIRMED' } });
      
      if (relatedPayments.length === 0) {
        return NextResponse.json({
          error: "The user's payment has not yet been confirmed, hence there is no harvest to release."
        }, { status: 400 });
      }

      const harvestAmount = relatedPayments.reduce((acc, p) => acc + p.amount, 0);

      // Update commitment status to COMPLETED and record the harvest amount
      await db.commitment.update({
        where: { id: commitmentId },
        data: {
          status: 'COMPLETED',
          harvestAmount,
          harvestReleasedAt: new Date()
        }
      });

      if (member) {
        const host = request.headers.get('host') || 'savvey-savers.vercel.app';
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const origin = `${protocol}://${host}`;
        
        await sendTemplatedEmail("23", member.email, {
          name: member.name,
          saving_goal: cmt.goal,
          url: `${origin}/dashboard/commitments`
        });

        // Member Notification
        await db.notification.create({ data: {
          userId: member.id,
          message: `Congratulations! Your harvest payout of £${harvestAmount} has been released.`,
          type: 'HARVEST_RELEASED',
          isRead: false
        } });
      }

      // Admin Notification
      await db.notification.create({ data: {
        userId: session.id,
        message: `You successfully released a harvest payout of £${harvestAmount} for ${member?.name || 'Unknown'} (${cmt.collectionMonth} ${cmt.collectionYear}).`,
        type: 'SYSTEM',
        isRead: false
      } });

      await db.auditLog.create({ data: {
        action: 'HARVEST_RELEASE',
        details: `Released payout harvest of £${harvestAmount} for commitment ${commitmentId}.`,
        userId: session.id
      } });

      return NextResponse.json({ success: true });
    }

    // --- Action 4: SEND_REMINDER ---
    if (action === 'SEND_REMINDER') {
      const { memberIds, commitmentIds } = await request.json().catch(() => ({})) || {};
      const targetMemberIds: string[] = Array.isArray(memberIds)
        ? memberIds
        : memberId
        ? [memberId]
        : [];
      const targetCommitmentIds: string[] = Array.isArray(commitmentIds)
        ? commitmentIds
        : commitmentId
        ? [commitmentId]
        : [];

      if (targetMemberIds.length === 0 && targetCommitmentIds.length === 0) {
        return NextResponse.json({ error: 'At least one member or commitment is required.' }, { status: 400 });
      }

      let count = 0;

      if (targetCommitmentIds.length > 0) {
        for (const cId of targetCommitmentIds) {
          const cmt = await db.commitment.findUnique({ where: { id: cId } });
          if (cmt) {
            const member = await db.user.findUnique({ where: { id: cmt.memberId } });
            if (member) {
              await sendTemplatedEmail("14", member.email, {
                name: member.name,
                current_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
              });
              await db.notification.create({ data: {
                userId: member.id,
                message: `Friendly reminder regarding your savings commitment "${cmt.goal}".`,
                type: 'REMINDER_SENT',
                isRead: false
              } });
              count++;
            }
          }
        }
      } else {
        for (const mId of targetMemberIds) {
          const member = await db.user.findUnique({ where: { id: mId } });
          if (member) {
            await sendTemplatedEmail("14", member.email, {
              name: member.name,
              current_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
            });
            await db.notification.create({ data: {
              userId: member.id,
              message: `Friendly reminder sent by coordinator regarding your savings commitments.`,
              type: 'REMINDER_SENT',
              isRead: false
            } });
            count++;
          }
        }
      }

      await db.auditLog.create({ data: {
        action: 'SEND_REMINDER',
        details: `Sent bulk contribution reminder emails to ${count} recipient(s).`,
        userId: session.id
      } });

      return NextResponse.json({ success: true, count });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (err: any) {
    console.error('Commitment action error:', err);
    return NextResponse.json({ error: 'Failed to execute commitment action.' }, { status: 500 });
  }
}
