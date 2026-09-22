import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { name, email, phone, monthlySavingsCommitment, referredBy } = await request.json();

    if (!name || !email || !phone || !monthlySavingsCommitment) {
      return NextResponse.json(
        { error: 'Name, email, phone, and monthly savings commitment are required.' },
        { status: 400 }
      );
    }

    if (String(name).length > 100 || String(email).length > 100 || String(phone).length > 30) {
      return NextResponse.json({ error: 'Input fields exceed maximum allowed length.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const commitmentVal = parseFloat(String(monthlySavingsCommitment).replace(/[^0-9.]/g, ''));
    if (isNaN(commitmentVal) || commitmentVal <= 0) {
      return NextResponse.json({ error: 'Please provide a valid monthly savings amount greater than zero.' }, { status: 400 });
    }

    const existingWaiting = await db.waitingList.findFirst({ where: { email: normalizedEmail } });
    if (existingWaiting) {
      return NextResponse.json({ error: 'This email is already on the waiting list.' }, { status: 400 });
    }

    const existingUser = await db.user.findFirst({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'This email is already registered as a member on the platform.' }, { status: 400 });
    }

    let finalReferredBy = referredBy ? String(referredBy).trim() : undefined;
    if (finalReferredBy) {
      const allUsers = await db.user.findMany({ select: { id: true, displayId: true, invitationId: true, email: true } });
      const matched = allUsers.find(u =>
        u.id.toLowerCase() === finalReferredBy!.toLowerCase() ||
        (u.displayId && u.displayId.toLowerCase() === finalReferredBy!.toLowerCase()) ||
        (u.invitationId && u.invitationId.toLowerCase() === finalReferredBy!.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === finalReferredBy!.toLowerCase())
      );
      if (matched) finalReferredBy = matched.id;
    }

    const entry = await db.waitingList.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: String(phone).trim(),
        monthlySavingsCommitment: commitmentVal,
        isReferred: !!finalReferredBy,
        referredBy: finalReferredBy,
      }
    });

    try {
      const adminUser = await db.user.findFirst({ where: { id: session.id } });
      if (adminUser) {
        await db.auditLog.create({
          data: {
            action: 'ADMIN_PROSPECT_ADD',
            details: `Admin manually added prospect ${name} (${normalizedEmail}) to the waiting list.`,
            userId: adminUser.id,
          }
        });
      }
    } catch (auditErr) {
      console.warn('Failed to record audit log for prospect add:', auditErr);
    }

    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    console.error('Add prospect error:', err);
    return NextResponse.json({ error: 'Failed to add prospect to waiting list.' }, { status: 500 });
  }
}
