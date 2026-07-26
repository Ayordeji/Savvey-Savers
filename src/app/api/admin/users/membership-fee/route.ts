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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (userId) {
    const records = await db.membershipFeeRecords.findMany((r) => r.userId === userId);
    const sorted = [...records].sort((a, b) => b.year - a.year);
    return NextResponse.json(sorted);
  }

  const allRecords = await db.membershipFeeRecords.findMany();
  return NextResponse.json(allRecords);
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, userId, year, baseFee, adminFee, recordId, amountPaid, paidAt } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const user = await db.users.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (action === 'REQUEST') {
      const parsedYear = Number(year);
      const parsedBase = Number(baseFee) || 0;
      const parsedAdmin = Number(adminFee) || 0;
      const totalFee = parsedBase + parsedAdmin;

      if (!parsedYear || totalFee <= 0) {
        return NextResponse.json({ error: 'Valid membership year and positive fee amounts are required.' }, { status: 400 });
      }

      // Check if record exists for this year
      const existingRecords = await db.membershipFeeRecords.findMany((r) => r.userId === userId && Number(r.year) === parsedYear);
      let record;

      if (existingRecords.length > 0) {
        record = await db.membershipFeeRecords.update({
          where: { id: existingRecords[0].id },
          data: {
            baseFee: parsedBase,
            adminFee: parsedAdmin,
            totalFee: totalFee,
            status: 'PENDING',
            requestedAt: new Date().toISOString()
          }
        });
      } else {
        record = await db.membershipFeeRecords.create({
          userId,
          year: parsedYear,
          baseFee: parsedBase,
          adminFee: parsedAdmin,
          totalFee: totalFee,
          status: 'PENDING',
          requestedAt: new Date().toISOString()
        });
      }

      // Update user fee status flag
      await db.users.update({
        where: { id: userId },
        data: {
          membershipFeeConfirmed: false
        }
      });

      // Notify User via Email
      await sendEmail({
        to: user.email,
        subject: `Membership Fee Payment Request - £${totalFee.toFixed(2)} (${parsedYear})`,
        body: `Hello ${user.name},\n\nA membership fee payment request for the year ${parsedYear} has been generated.\n\nFee Breakdown:\n- Base Membership Fee: £${parsedBase.toFixed(2)}\n- Admin Fee: £${parsedAdmin.toFixed(2)}\n- Total Amount Due: £${totalFee.toFixed(2)}\n\nPlease settle this payment with your group coordinator.\n\nBest regards,\nSavvey Savers Collective`
      });

      // Create in-app notification
      await db.notifications.create({
        userId,
        message: `Membership Fee request for ${parsedYear} (£${totalFee.toFixed(2)}) has been issued.`,
        type: 'FEE_REQUEST',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true, record });

    } else if (action === 'RECORD_PAYMENT' || action === 'CONFIRM_PAYMENT') {
      const parsedAmount = Number(amountPaid);
      const paymentDate = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();

      let recordToUpdate;
      if (recordId) {
        recordToUpdate = await db.membershipFeeRecords.findUnique({ where: { id: recordId } });
      } else {
        const userRecords = await db.membershipFeeRecords.findMany((r) => r.userId === userId);
        const pendingRecord = userRecords.find((r) => r.status === 'PENDING') || userRecords[0];
        recordToUpdate = pendingRecord;
      }

      if (recordToUpdate) {
        await db.membershipFeeRecords.update({
          where: { id: recordToUpdate.id },
          data: {
            status: 'PAID',
            totalFee: parsedAmount || recordToUpdate.totalFee,
            paidAt: paymentDate
          }
        });
      } else {
        // Create paid record if none existed
        await db.membershipFeeRecords.create({
          userId,
          year: new Date().getFullYear(),
          baseFee: parsedAmount || 0,
          adminFee: 0,
          totalFee: parsedAmount || 0,
          status: 'PAID',
          requestedAt: paymentDate,
          paidAt: paymentDate
        });
      }

      // Mark user fee confirmed
      await db.users.update({
        where: { id: userId },
        data: {
          membershipFeeConfirmed: true,
          membershipFeeConfirmedAt: paymentDate
        }
      });

      // Send Email confirmation
      await sendEmail({
        to: user.email,
        subject: `Membership Fee Payment Received - £${parsedAmount || recordToUpdate?.totalFee || 0}`,
        body: `Hello ${user.name},\n\nYour membership fee payment of £${(parsedAmount || recordToUpdate?.totalFee || 0).toFixed(2)} has been recorded as paid.\n\nPayment Date: ${new Date(paymentDate).toLocaleDateString('en-GB')}\n\nThank you,\nSavvey Savers Collective`
      });

      // Create in-app notification
      await db.notifications.create({
        userId,
        message: `Your membership fee payment of £${(parsedAmount || recordToUpdate?.totalFee || 0).toFixed(2)} has been confirmed.`,
        type: 'FEE_PAID',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true });

    } else if (action === 'REMIND') {
      // Send reminder email to pay up
      const userRecords = await db.membershipFeeRecords.findMany((r) => r.userId === userId && r.status === 'PENDING');
      const pendingFee = userRecords[0];
      const dueAmount = pendingFee ? pendingFee.totalFee : 230;

      await sendEmail({
        to: user.email,
        subject: `Payment Reminder: Outstanding Membership Fee (£${dueAmount.toFixed(2)})`,
        body: `Hello ${user.name},\n\nThis is a friendly reminder to pay your outstanding membership fee of £${dueAmount.toFixed(2)} for ${pendingFee ? pendingFee.year : new Date().getFullYear()}.\n\nPlease complete your offline payment with your group coordinator at your earliest convenience.\n\nThank you,\nSavvey Savers Collective`
      });

      await db.notifications.create({
        userId,
        message: `Reminder: Please settle your outstanding membership fee of £${dueAmount.toFixed(2)}.`,
        type: 'FEE_REMINDER',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: 'Reminder email sent successfully.' });

    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Membership fee action error:', err);
    return NextResponse.json({ error: 'Failed to process membership fee action.' }, { status: 500 });
  }
}
