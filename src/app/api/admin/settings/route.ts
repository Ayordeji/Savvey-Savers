import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  // Publicly accessible settings for landing page and dashboard
  const savingGoals = (await db.settings.findUnique({ where: { key: 'savingGoals' } }))?.value || [];
  const commitmentAmounts = (await db.settings.findUnique({ where: { key: 'commitmentAmounts' } }))?.value || [];
  const membershipAgreement = (await db.settings.findUnique({ where: { key: 'membershipAgreement' } }))?.value || null;
  const feeSchedule = (await db.settings.findUnique({ where: { key: 'feeSchedule' } }))?.value || null;

  const securityQuestions = (await db.settings.findUnique({ where: { key: 'securityQuestions' } }))?.value || [
    "What was the name of your first primary school?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was your first pet's name?",
    "What is your favorite book title?"
  ];

  const collectionMonthsMap = (await db.settings.findUnique({ where: { key: 'collectionMonthsMap' } }))?.value || {
    "100.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "250.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "300.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "500.00": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  };

  const notificationSettings = (await db.settings.findUnique({ where: { key: 'notificationSettings' } }))?.value || {
    emailOnInvite: true,
    emailOnPayment: true,
    emailOnPayout: true,
    emailOnReminder: true
  };

  const emailTemplates = (await db.settings.findUnique({ where: { key: 'emailTemplates' } }))?.value || [
    { id: "1", title: "Forgot Password", reminderHours: "N/A", subject: "Password Reset Request - Savvey Savers", body: "Hello {{name}},\n\nYou requested to reset your password. Click the link below to set a new password:\n{{link}}\n\nBest regards,\nSavvey Savers Team" },
    { id: "2", title: "Savvey Savers Account Registration", reminderHours: "N/A", subject: "Welcome to Savvey Savers!", body: "Hello {{name}},\n\nYour account has been registered successfully. Welcome to your rotating savings portal!\n\nBest regards,\nSavvey Savers Team" },
    { id: "3", title: "Admin Notice of Member Invitation", reminderHours: "N/A", subject: "Member Invitation Created", body: "Hello Admin,\n\nA new invitation link has been dispatched to {{email}}.\n\nSavvey Savers Team" },
    { id: "4", title: "Update Saving Commitment", reminderHours: "N/A", subject: "Savings Commitment Updated", body: "Hello {{name}},\n\nYour savings commitment has been updated to {{amount}} for {{month}} {{year}}.\n\nSavvey Savers Team" },
    { id: "5", title: "Savings Commitment Finalisation To Admin", reminderHours: "N/A", subject: "Commitment Finalized", body: "Admin Alert: Member {{name}} finalized commitment cycle." },
    { id: "6", title: "Savings Commitment Finalisation To Member", reminderHours: "N/A", subject: "Commitment Confirmed", body: "Hello {{name}},\n\nYour savings commitment cycle has been confirmed and activated." },
    { id: "7", title: "Hurry, Join the Savvey Savers Club! Reminder 1", reminderHours: "12", subject: "Friendly Reminder: Complete Your Registration", body: "Hello prospect,\n\nDon't forget to complete your registration to join the Savvey Savers Collective!" },
    { id: "8", title: "Hurry, Join the Savvey Savers Club! Reminder 2", reminderHours: "168", subject: "Reminder: Join your savings circle today!", body: "Hello prospect,\n\nYour spot in the savings circle is still reserved. Finalize your membership application now!" },
    { id: "9", title: "Last Chance to Join the Savvey Savers Club Reminder 3", reminderHours: "336", subject: "Final Notice: Savings Circle Access Expiring Soon", body: "Hello prospect,\n\nThis is your final reminder to join our savings community." },
    { id: "10", title: "Create Savings Commitment Reminder 1", reminderHours: "48", subject: "Action Required: Set Up Your Savings Goal", body: "Hello {{name}},\n\nPlease log into your dashboard to set up your target savings goal and collection month." }
  ];

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

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required.' }, { status: 400 });
    }

    // Save/update settings
    const existing = await db.settings.findUnique({ where: { key } });
    if (existing) {
      await db.settings.update({
        where: { key },
        data: { value }
      });
    } else {
      await db.settings.create({
        key,
        value
      });
    }

    await db.auditLogs.create({
      action: 'ADMIN_SETTINGS_UPDATE',
      details: `Admin updated settings configuration for key: ${key}.`,
      userId: 'usr_admin'
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Update settings error:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
