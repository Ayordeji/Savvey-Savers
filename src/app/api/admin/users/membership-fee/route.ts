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
    const records = await db.membershipFeeRecord.findMany({ where: { userId } });
    const sorted = [...records].sort((a, b) => b.year - a.year);
    return NextResponse.json(sorted);
  }

  const allRecords = await db.membershipFeeRecord.findMany();
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

    const user = await db.user.findUnique({ where: { id: userId } });
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

      // Flag if record already exists for this year
      const existingRecords = await db.membershipFeeRecord.findMany({ where: { userId, year: parsedYear } });
      if (existingRecords.length > 0) {
        return NextResponse.json({ error: `A membership fee request has already been created for the year ${parsedYear}.` }, { status: 400 });
      }

      const record = await db.membershipFeeRecord.create({ data: {
        userId,
        year: parsedYear,
        baseFee: parsedBase,
        adminFee: parsedAdmin,
        totalFee: totalFee,
        status: 'PENDING',
        requestedAt: new Date()
      } });

      // Update user fee status flag
      await db.user.update({
        where: { id: userId },
        data: {
          membershipFeeConfirmed: false
        }
      });

      // Notify User via Email
      await sendEmail({
        to: user.email,
        subject: `Fee Request`,
        body: `Dear ${user.name},\n\nYour ${parsedYear} Annual Membership Fee of £${totalFee.toFixed(2)} is now due.\n\nPlease make payment to the bank account provided by your Relationship Manager to secure your collection slot for the year.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective`
      });

      // Create in-app notification
      await db.notification.create({ data: {
        userId,
        message: `Membership Fee request for ${parsedYear} (£${totalFee.toFixed(2)}) has been issued.`,
        type: 'FEE_REQUEST',
        isRead: false,
        createdAt: new Date().toISOString() } });

      return NextResponse.json({ success: true, record });

    } else if (action === 'EDIT') {
      const parsedBase = baseFee !== undefined ? Number(baseFee) : undefined;
      const parsedAdmin = adminFee !== undefined ? Number(adminFee) : undefined;
      const parsedYear = year !== undefined ? Number(year) : undefined;

      let recordToEdit;
      if (recordId) {
        recordToEdit = await db.membershipFeeRecord.findUnique({ where: { id: recordId } });
      } else if (year) {
        const userRecords = await db.membershipFeeRecord.findMany({ where: { userId, year: Number(year) } });
        recordToEdit = userRecords[0];
      }

      if (!recordToEdit) {
        return NextResponse.json({ error: 'Membership fee record not found.' }, { status: 404 });
      }

      const newBase = parsedBase !== undefined ? parsedBase : recordToEdit.baseFee;
      const newAdmin = parsedAdmin !== undefined ? parsedAdmin : recordToEdit.adminFee;
      const newYear = parsedYear !== undefined ? parsedYear : recordToEdit.year;
      const newTotal = newBase + newAdmin;

      const record = await db.membershipFeeRecord.update({
        where: { id: recordToEdit.id },
        data: {
          baseFee: newBase,
          adminFee: newAdmin,
          year: newYear,
          totalFee: newTotal,
          updatedAt: new Date().toISOString()
        }
      });

      return NextResponse.json({ success: true, record });

    } else if (action === 'RECORD_PAYMENT' || action === 'CONFIRM_PAYMENT') {
      const parsedAmount = Number(amountPaid);
      const paymentDate = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();

      let recordToUpdate;
      if (recordId) {
        recordToUpdate = await db.membershipFeeRecord.findUnique({ where: { id: recordId } });
      } else if (year) {
        const userRecords = await db.membershipFeeRecord.findMany({ where: { userId, year: Number(year) } });
        recordToUpdate = userRecords.find((r) => r.status === 'PENDING') || userRecords[0];
      } else {
        const userRecords = await db.membershipFeeRecord.findMany({ where: { userId } });
        const pendingRecord = userRecords.find((r) => r.status === 'PENDING') || userRecords[0];
        recordToUpdate = pendingRecord;
      }

      if (recordToUpdate) {
        await db.membershipFeeRecord.update({
          where: { id: recordToUpdate.id },
          data: {
            status: 'PAID',
            totalFee: parsedAmount || recordToUpdate.totalFee,
            paidAt: paymentDate
          }
        });
      } else {
        // Create paid record if none existed
        await db.membershipFeeRecord.create({ data: {
          userId,
          year: new Date().getFullYear(),
          baseFee: parsedAmount || 0,
          adminFee: 0,
          totalFee: parsedAmount || 0,
          status: 'PAID',
          requestedAt: new Date(paymentDate),
          paidAt: new Date(paymentDate)
        } });
      }

      // Mark user fee confirmed
      await db.user.update({
        where: { id: userId },
        data: {
          membershipFeeConfirmed: true,
          membershipFeeConfirmedAt: paymentDate
        }
      });

      // Send Email confirmation
      const paidAmount = (parsedAmount || recordToUpdate?.totalFee || 0).toFixed(2);
      const year = recordToUpdate?.year || new Date().getFullYear();
      await sendEmail({
        to: user.email,
        subject: `Fee Payment Confirmation`,
        body: `Dear ${user.name},\n\nThank you for your payment.\n\nThis is to confirm that we have received your ${year} Membership Fee of £${paidAmount} on ${new Date(paymentDate).toLocaleDateString('en-GB')}.\n\nWe look forward to supporting you throughout your savings journey and thank you for choosing to be part of the Savvey Savers Collective.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective`
      });

      // Create in-app notification
      await db.notification.create({ data: {
        userId,
        message: `Your membership fee payment of £${(parsedAmount || recordToUpdate?.totalFee || 0).toFixed(2)} has been confirmed.`,
        type: 'FEE_PAID',
        isRead: false,
        createdAt: new Date().toISOString() } });

      return NextResponse.json({ success: true });

    } else if (action === 'REMIND') {
      // Send reminder email to pay up
      const userRecords = await db.membershipFeeRecord.findMany({ where: { userId, status: 'PENDING' } });
      const pendingFee = userRecords[0];
      const dueAmount = pendingFee ? pendingFee.totalFee : 230;

      await sendEmail({
        to: user.email,
        subject: `Payment Reminder: Outstanding Membership Fee (£${dueAmount.toFixed(2)})`,
        body: `Hello ${user.name},\n\nThis is a friendly reminder to pay your outstanding membership fee of £${dueAmount.toFixed(2)} for ${pendingFee ? pendingFee.year : new Date().getFullYear()}.\n\nPlease complete your offline payment with your group coordinator at your earliest convenience.\n\nThank you,\nSavvey Savers Collective`
      });

      await db.notification.create({ data: {
        userId,
        message: `Reminder: Please settle your outstanding membership fee of £${dueAmount.toFixed(2)}.`,
        type: 'FEE_REMINDER',
        isRead: false,
        createdAt: new Date().toISOString() } });

      return NextResponse.json({ success: true, message: 'Reminder email sent successfully.' });

    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Membership fee action error:', err);
    return NextResponse.json({ error: 'Failed to process membership fee action.' }, { status: 500 });
  }
}
