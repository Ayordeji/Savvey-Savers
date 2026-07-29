import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { defaultEmailTemplates } from '@/lib/emailTemplates';

async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  // Publicly accessible settings for landing page and dashboard
  const savingGoals = (await db.setting.findUnique({ where: { key: 'savingGoals' } }))?.value || [
    { goal: "Debt Repayment", enabled: true },
    { goal: "Dream Holiday", enabled: true },
    { goal: "Investment", enabled: true },
    { goal: "My First Home", enabled: true },
    { goal: "Property Purchase", enabled: true },
    { goal: "Savings", enabled: true },
    { goal: "School Fees", enabled: true },
    { goal: "Wedding", enabled: true },
    { goal: "Other", enabled: true }
  ];
  const commitmentAmounts = (await db.setting.findUnique({ where: { key: 'commitmentAmounts' } }))?.value || [
    { amount: "100.00", enabled: true },
    { amount: "250.00", enabled: true },
    { amount: "300.00", enabled: true },
    { amount: "500.00", enabled: true },
    { amount: "750.00", enabled: true },
    { amount: "1000.00", enabled: true },
    { amount: "1250.00", enabled: true },
    { amount: "1500.00", enabled: true }
  ];
  const membershipAgreement = (await db.setting.findUnique({ where: { key: 'membershipAgreement' } }))?.value || null;
  const feeSchedule = (await db.setting.findUnique({ where: { key: 'feeSchedule' } }))?.value || null;

  const securityQuestions = (await db.setting.findUnique({ where: { key: 'securityQuestions' } }))?.value || [
    "What was the name of your first primary school?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was your first pet's name?",
    "What is your favorite book title?"
  ];

  const collectionMonthsMap = (await db.setting.findUnique({ where: { key: 'collectionMonthsMap' } }))?.value || {
    "100.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "250.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "300.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "500.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  };

  const notificationSettings = (await db.setting.findUnique({ where: { key: 'notificationSettings' } }))?.value || {
    emailOnInvite: true,
    emailOnPayment: true,
    emailOnPayout: true,
    emailOnReminder: true
  };

  const dbEmailTemplates = (await db.setting.findUnique({ where: { key: 'emailTemplates' } }))?.value || [];
  const existingIds = new Set((dbEmailTemplates as any[]).map((t: any) => t.id));
  const emailTemplates = [
    ...(dbEmailTemplates as any[]),
    ...defaultEmailTemplates.filter((t) => !existingIds.has(t.id))
  ].sort((a, b) => parseInt(a.id) - parseInt(b.id));

  return NextResponse.json({
    savingGoals,
    commitmentAmounts,
    membershipAgreement,
    feeSchedule,
    securityQuestions,
    collectionMonthsMap,
    notificationSettings,
    emailTemplates
  });
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { key, value } = await request.json();

    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: 'Key and value are required.' }, { status: 400 });
    }

    // Save/update settings
    const existing = await db.setting.findUnique({ where: { key } });
    if (existing) {
      await db.setting.update({
        where: { key },
        data: { value }
      });
    } else {
      await db.setting.create({ data: {
        key,
        value
      } });
    }

    await db.auditLog.create({ data: {
      action: 'ADMIN_SETTINGS_UPDATE',
      details: `Admin updated settings configuration for key: ${key}.`,
      userId: session.id
    } });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Update settings error:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
