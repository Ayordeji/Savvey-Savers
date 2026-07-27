import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { name, email, phone, monthlySavingsCommitment, referredBy } = await request.json();

    if (!name || !email || !phone || !monthlySavingsCommitment) {
      return NextResponse.json(
        { error: 'Name, email, phone number, and intended savings amount are required.' },
        { status: 400 }
      );
    }

    // Input length validation
    if (
      name.length > 100 ||
      email.length > 100 ||
      phone.length > 30 ||
      (referredBy && referredBy.length > 100)
    ) {
      return NextResponse.json(
        { error: 'Input fields exceed maximum allowed length limits.' },
        { status: 400 }
      );
    }

    // Input format validation: Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Input format validation: Strict UK Phone number check (+44 or 07...)
    const cleanedPhone = String(phone || '').trim().replace(/[\s\-\(\)]/g, '');
    const isUkPhone = /^(\+44|0)[1-9]\d{8,9}$/.test(cleanedPhone);
    if (!isUkPhone) {
      return NextResponse.json(
        { error: 'Only valid UK phone numbers starting with +44 or 07... are accepted.' },
        { status: 400 }
      );
    }

    const rawAmount = String(monthlySavingsCommitment || '').replace(/[^0-9.]/g, '');
    const commitmentVal = parseFloat(rawAmount);
    if (isNaN(commitmentVal) || commitmentVal <= 0) {
      return NextResponse.json(
        { error: 'Please select a valid monthly savings goal amount.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already on waiting list
    const existingWaiting = await db.waitingList.findFirst({ where: { email: normalizedEmail } });
    if (existingWaiting) {
      return NextResponse.json(
        { error: 'You are already on our waiting list! We will reach out shortly.' },
        { status: 400 }
      );
    }

    // Check if email already a registered member
    const existingUser = await db.user.findFirst(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered as a member on the platform.' },
        { status: 400 }
      );
    }

    // Save waiting list entry
    const entry = await db.waitingList.create({ data: { name,
      email: normalizedEmail,
      phone,
      monthlySavingsCommitment: commitmentVal,
      isReferred: !!referredBy,
      referredBy: referredBy || undefined,
    } });

    // Create notifications for all admins and audit log (non-blocking side-effects)
    try {
      const admins = await db.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        try {
          await db.notification.create({ data: {
            userId: admin.id,
            message: `New prospect ${name} signed up on the waiting list. Intended amount: £${commitmentVal}.`,
            type: 'WAITING_LIST_SIGNUP',
            isRead: false,
          } });

          await sendEmail({
            to: admin.email,
            subject: 'Savvey Savers - New Waiting List Signup',
            body: `Hello ${admin.name},\n\nA new prospect has registered on the Savvey Savers waiting list.\n\nDetails:\n- Name: ${name}\n- Email: ${email}\n- Phone: ${phone}\n- Intended Monthly Savings: £${commitmentVal}\n${referredBy ? `- Referred By: ${referredBy}\n` : ''}\nYou can review and approve this signup inside your coordinator dashboard.\n\nBest regards,\nSavvey Savers Team`
          });
        } catch (adminErr) {
          console.warn(`Failed notification for admin ${admin.email}:`, adminErr);
        }
      }

      await db.auditLog.create({ data: {
        action: 'WAITING_LIST_ADD',
        details: `Prospect ${name} (${email}) added to waiting list.`,
        userId: 'system',
      } });
    } catch (sideEffectErr) {
      console.warn('Waiting list side-effects warning:', sideEffectErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully registered on the waiting list!',
    });
  } catch (err: any) {
    console.error('Waiting list error:', err);
    return NextResponse.json(
      { error: 'Failed to register on the waiting list.' },
      { status: 500 }
    );
  }
}
