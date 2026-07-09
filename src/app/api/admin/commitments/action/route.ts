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
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required.' }, { status: 400 });
      }

      const payment = await db.payments.findUnique({ where: { id: paymentId } });
      if (!payment) {
        return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
      }

      const cmt = await db.commitments.findUnique({ where: { id: payment.commitmentId } });
      const member = cmt ? await db.users.findUnique({ where: { id: cmt.memberId } }) : null;

      // Update payment
      await db.payments.update({
        where: { id: paymentId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString(),
          confirmedById: session.id
        }
      });

      if (member && cmt) {
        // Dispatch Email Notification
        await sendEmail({
          to: member.email,
          subject: 'Savvey Savers - Payment Confirmation',
          body: `Hello ${member.name},\n\nThis is to confirm that your savings payment of £${payment.amount} for ${payment.month} ${payment.year} (Commitment: ${cmt.goal}) has been successfully received and confirmed.\n\nThank you for saving!\n\nBest regards,\nSavvey Savers Team`
        });

        // Member Notification
        await db.notifications.create({
          userId: member.id,
          message: `Your payment of £${payment.amount} for ${payment.month} ${payment.year} has been confirmed.`,
          type: 'PAYMENT_CONFIRMED',
          isRead: false
        });
      }

      await db.auditLogs.create({
        action: 'PAYMENT_CONFIRM',
        details: `Confirmed savings payment of £${payment.amount} for ${payment.month} ${payment.year}.`,
        userId: session.id
      });

      return NextResponse.json({ success: true });
    }

    // --- Action 2: RECORD_PAST_PAYMENT ---
    if (action === 'RECORD_PAST_PAYMENT') {
      if (!commitmentId || !month || !year || !amount) {
        return NextResponse.json({ error: 'Commitment, month, year, and amount are required.' }, { status: 400 });
      }

      const cmt = await db.commitments.findUnique({ where: { id: commitmentId } });
      if (!cmt) {
        return NextResponse.json({ error: 'Commitment not found.' }, { status: 404 });
      }

      const member = await db.users.findUnique({ where: { id: cmt.memberId } });

      // Create confirmed payment
      const pastPayment = await db.payments.create({
        commitmentId,
        amount: parseFloat(amount),
        month,
        year: parseInt(year),
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        confirmedById: session.id,
        receiptUrl: receiptUrl || null
      });

      if (member) {
        // Send Email
        await sendEmail({
          to: member.email,
          subject: 'Savvey Savers - Past Payment Recorded',
          body: `Hello ${member.name},\n\nAn administrator has recorded a past contribution payment of £${amount} for ${month} ${year} under your commitment (${cmt.goal}).\n\nBest regards,\nSavvey Savers Team`
        });

        // Member Notification
        await db.notifications.create({
          userId: member.id,
          message: `Past contribution of £${amount} for ${month} ${year} has been recorded by the admin.`,
          type: 'PAYMENT_RECORDED',
          isRead: false
        });
      }

      await db.auditLogs.create({
        action: 'PAST_PAYMENT_RECORD',
        details: `Recorded past payment of £${amount} for ${month} ${year} under commitment ${commitmentId}.`,
        userId: session.id
      });

      return NextResponse.json({ success: true, payment: pastPayment });
    }

    // --- Action 3: RELEASE_HARVEST ---
    if (action === 'RELEASE_HARVEST') {
      if (!commitmentId) {
        return NextResponse.json({ error: 'Commitment ID is required.' }, { status: 400 });
      }

      const cmt = await db.commitments.findUnique({ where: { id: commitmentId } });
      if (!cmt) {
        return NextResponse.json({ error: 'Commitment not found.' }, { status: 404 });
      }

      const member = await db.users.findUnique({ where: { id: cmt.memberId } });

      // Compute total confirmed payout amount (total payments received)
      const relatedPayments = await db.payments.findMany((p) => p.commitmentId === commitmentId && p.status === 'CONFIRMED');
      const harvestAmount = relatedPayments.reduce((acc, p) => acc + p.amount, 0);

      // Update commitment status to COMPLETED
      await db.commitments.update({
        where: { id: commitmentId },
        data: {
          status: 'COMPLETED'
        }
      });

      if (member) {
        // Send Email
        await sendEmail({
          to: member.email,
          subject: 'Savvey Savers - Harvest Payout Released!',
          body: `Hello ${member.name},\n\nCongratulations! Your savings harvest payout of £${harvestAmount} has been officially released for your collection month ${cmt.collectionMonth} ${cmt.collectionYear}.\n\nYour rotating savings cycle goal (${cmt.goal}) has been successfully achieved and closed.\n\nThank you for choosing Savvey Savers!\n\nBest regards,\nSavvey Savers Team`
        });

        // Member Notification
        await db.notifications.create({
          userId: member.id,
          message: `Congratulations! Your harvest payout of £${harvestAmount} has been released.`,
          type: 'HARVEST_RELEASED',
          isRead: false
        });
      }

      await db.auditLogs.create({
        action: 'HARVEST_RELEASE',
        details: `Released payout harvest of £${harvestAmount} for commitment ${commitmentId}.`,
        userId: session.id
      });

      return NextResponse.json({ success: true });
    }

    // --- Action 4: SEND_REMINDER ---
    if (action === 'SEND_REMINDER') {
      if (!memberId || !commitmentId) {
        return NextResponse.json({ error: 'Member and commitment are required.' }, { status: 400 });
      }

      const member = await db.users.findUnique({ where: { id: memberId } });
      const cmt = await db.commitments.findUnique({ where: { id: commitmentId } });

      if (!member || !cmt) {
        return NextResponse.json({ error: 'Member or commitment not found.' }, { status: 404 });
      }

      // Send reminder email
      await sendEmail({
        to: member.email,
        subject: 'Savvey Savers - Friendly Savings Reminder',
        body: `Hello ${member.name},\n\nThis is a friendly reminder from your Savvey Savers coordinator regarding your outstanding savings commitment for "${cmt.goal}" (Monthly amount: £${cmt.amount}).\n\nPlease proceed with your offline payment/deposit and notify your coordinator to confirm receipt.\n\nBest regards,\nSavvey Savers Team`
      });

      // Member Notification
      await db.notifications.create({
        userId: member.id,
        message: `Friendly reminder sent by coordinator regarding your savings commitment "${cmt.goal}".`,
        type: 'REMINDER_SENT',
        isRead: false
      });

      await db.auditLogs.create({
        action: 'SEND_REMINDER',
        details: `Sent contribution reminder email to ${member.name} (${member.email}) regarding commitment ${commitmentId}.`,
        userId: session.id
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (err: any) {
    console.error('Commitment action error:', err);
    return NextResponse.json({ error: 'Failed to execute commitment action.' }, { status: 500 });
  }
}
