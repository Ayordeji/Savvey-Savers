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
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { subject, message, audience, userIds } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    let recipients: any[] = [];

    if (audience === 'SELECTED' && Array.isArray(userIds) && userIds.length > 0) {
      recipients = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, firstName: true, email: true }
      });
    } else if (audience === 'INACTIVE') {
      recipients = await db.user.findMany({
        where: { isActive: false },
        select: { id: true, name: true, firstName: true, email: true }
      });
    } else if (audience === 'ALL') {
      recipients = await db.user.findMany({
        where: { role: 'MEMBER' },
        select: { id: true, name: true, firstName: true, email: true }
      });
    } else {
      // Default: ACTIVE members
      recipients = await db.user.findMany({
        where: { isActive: true, role: 'MEMBER' },
        select: { id: true, name: true, firstName: true, email: true }
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients matched the selected audience criteria.' }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      if (!recipient.email) continue;
      const firstName = recipient.firstName || recipient.name.split(' ')[0] || recipient.name;
      const personalizedBody = `Dear <b>${firstName}</b>,<br /><br />${message.replace(/\n/g, '<br />')}<br /><br />Kind regards,<br /><b>Savvey Savers Network Support</b><br /><a href="https://savveysavers.com">https://savveysavers.com</a>`;

      try {
        const mailRes = await sendEmail({
          to: recipient.email,
          subject: subject.trim(),
          body: personalizedBody
        });
        if (mailRes.success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error(`Failed to broadcast email to ${recipient.email}:`, err);
        failedCount++;
      }
    }

    await db.auditLog.create({
      data: {
        action: 'ADMIN_ANNOUNCEMENT_BROADCAST',
        details: `Admin broadcasted email announcement "${subject}" to ${successCount} member(s). Failed: ${failedCount}. Audience: ${audience || 'ACTIVE'}.`,
        userId: session.id
      }
    });

    return NextResponse.json({
      success: true,
      totalRecipients: recipients.length,
      sentCount: successCount,
      failedCount
    });

  } catch (err: any) {
    console.error('Error broadcasting announcement:', err);
    return NextResponse.json({ error: 'Failed to send announcement emails.' }, { status: 500 });
  }
}
