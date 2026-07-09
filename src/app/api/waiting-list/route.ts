import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, phone, monthlySavingsCommitment, referredBy } = await request.json();

    if (!name || !email || !phone || !monthlySavingsCommitment) {
      return NextResponse.json(
        { error: 'Name, email, phone number, and intended savings amount are required.' },
        { status: 400 }
      );
    }

    const commitmentVal = parseFloat(monthlySavingsCommitment);
    if (isNaN(commitmentVal) || commitmentVal <= 0) {
      return NextResponse.json(
        { error: 'Please enter a valid monthly savings amount.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already on waiting list
    const existingWaiting = await db.waitingList.findFirst(
      (w) => w.email.toLowerCase() === normalizedEmail
    );
    if (existingWaiting) {
      return NextResponse.json(
        { error: 'You are already on our waiting list! We will reach out shortly.' },
        { status: 400 }
      );
    }

    // Check if email already a registered member
    const existingUser = await db.users.findFirst(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered as a member on the platform.' },
        { status: 400 }
      );
    }

    // Save waiting list entry
    const entry = await db.waitingList.create({
      name,
      email: normalizedEmail,
      phone,
      monthlySavingsCommitment: commitmentVal,
      isReferred: !!referredBy,
      referredBy: referredBy || undefined,
    });

    // Create notifications for all admins
    const admins = await db.users.findMany((u) => u.role === 'ADMIN');
    for (const admin of admins) {
      await db.notifications.create({
        userId: admin.id,
        message: `New prospect ${name} signed up on the waiting list. Intended amount: £${commitmentVal}.`,
        type: 'WAITING_LIST_SIGNUP',
        isRead: false,
      });
    }

    // Audit Log
    await db.auditLogs.create({
      action: 'WAITING_LIST_ADD',
      details: `Prospect ${name} (${email}) added to waiting list.`,
      userId: 'system',
    });

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
