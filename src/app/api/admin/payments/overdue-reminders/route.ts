import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { sendEmail, sendTemplatedEmail } from '@/lib/email';
import { defaultEmailTemplates } from '@/lib/emailTemplates';

async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = searchParams.get('month') || now.toLocaleString('en-GB', { month: 'long' });
    const year = parseInt(searchParams.get('year') || now.getFullYear().toString(), 10);

    // Fetch all active commitments with payments and user
    const commitments = await db.commitment.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING'] }
      },
      include: {
        user: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Determine overdue members
    const overdueList = [];
    for (const cmt of commitments) {
      if (!cmt.user) continue;

      // Payments for this month & year
      const matchingPayments = (cmt.payments || []).filter(
        p => p.month.toLowerCase() === month.toLowerCase() && p.year === year
      );

      const confirmedPayment = matchingPayments.find(p => p.status === 'CONFIRMED');
      if (!confirmedPayment) {
        const pendingPayment = matchingPayments.find(p => p.status === 'PENDING');
        overdueList.push({
          commitmentId: cmt.id,
          displayId: cmt.displayId || cmt.id,
          memberId: cmt.user.id,
          memberName: cmt.user.name || cmt.memberName || 'Member',
          email: cmt.user.email,
          userDisplayId: cmt.user.displayId || null,
          userActive: cmt.user.isActive,
          amount: cmt.amount,
          goal: cmt.goal,
          hasPendingPayment: !!pendingPayment,
          pendingPaymentId: pendingPayment?.id || null
        });
      }
    }

    // Get current template 27
    const dbEmailTemplatesSetting = await db.setting.findUnique({ where: { key: 'emailTemplates' } });
    const dbTemplates = (dbEmailTemplatesSetting?.value as any[]) || [];
    let template = dbTemplates.find((t: any) => t.id === '27');
    if (!template) {
      template = defaultEmailTemplates.find(t => t.id === '27');
    }

    return NextResponse.json({
      month,
      year,
      template: template || null,
      totalActive: commitments.length,
      overdueCount: overdueList.length,
      overdueList
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/payments/overdue-reminders:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { commitmentIds, month, year, customSubject, customBody } = body;

    if (!Array.isArray(commitmentIds) || commitmentIds.length === 0) {
      return NextResponse.json({ error: 'No commitments selected' }, { status: 400 });
    }

    const targetMonth = month || new Date().toLocaleString('en-GB', { month: 'long' });
    const targetYear = year || new Date().getFullYear();
    const monthYearStr = `${targetMonth} ${targetYear}`;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const cmtId of commitmentIds) {
      try {
        const cmt = await db.commitment.findUnique({
          where: { id: cmtId },
          include: { user: true }
        });

        if (!cmt || !cmt.user) {
          failCount++;
          continue;
        }

        const member = cmt.user;

        if (customSubject && customBody) {
          // Admin provided custom message
          let subject = customSubject
            .replace(/\{name\}/g, member.name)
            .replace(/\{current_month\}/g, monthYearStr);
          let emailBody = customBody
            .replace(/\{name\}/g, member.name)
            .replace(/\{current_month\}/g, monthYearStr);

          await sendEmail({
            to: member.email,
            subject,
            body: emailBody
          });
        } else {
          // Use Template 27
          await sendTemplatedEmail('27', member.email, {
            name: member.name,
            current_month: monthYearStr
          });
        }

        // Create in-app notification
        await db.notification.create({
          data: {
            userId: member.id,
            message: `Overdue Notice: Your savings contribution for ${monthYearStr} is now overdue. Please submit your payment promptly.`,
            type: 'REMINDER_SENT',
            isRead: false
          }
        });

        successCount++;
      } catch (err: any) {
        console.error(`Error sending overdue reminder for cmt ${cmtId}:`, err);
        failCount++;
        errors.push(err.message || String(err));
      }
    }

    // Record audit log
    await db.auditLog.create({
      data: {
        action: 'SEND_OVERDUE_REMINDER',
        details: `Dispatched ${successCount} overdue payment reminder email(s) for ${monthYearStr}. (${failCount} failed)`,
        userId: session.id
      }
    });

    return NextResponse.json({
      success: true,
      count: successCount,
      failed: failCount,
      month: targetMonth,
      year: targetYear
    });
  } catch (err: any) {
    console.error('Error in POST /api/admin/payments/overdue-reminders:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
