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
  const savingGoals = (await db.setting.findUnique({ where: { key: 'savingGoals' } }))?.value || [];
  const commitmentAmounts = (await db.setting.findUnique({ where: { key: 'commitmentAmounts' } }))?.value || [];
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

  const defaultEmailTemplates = [
    { id: "1", title: "Forgot Password", reminderHours: "24", enabled: true, subject: "Savvey Savers Forgot Password", body: "Dear <b>{name}</b>,\n\nYou have requested a password reset on the Savvey Savers peer-to-peer lending Platform.\n\nPlease use this link <a href=\"{reacturl}\">{reacturl}</a> to reset your password.\n\nIf you require any support, please contact your Admin.\n\nKind Regards,\nSavvey Savers Network Support." },
    { id: "2", title: "Savvey Savers Account Registration", reminderHours: "N/A", enabled: true, subject: "Savvey Savers Account Registration", body: "Dear <b>{name}</b>,\n\nYou have been invited by your Account Admin to register your account on the Savvey Savers peer-to-peer lending Platform.\n\nPlease use this link <a href=\"{reacturl}\">{reacturl}</a> to complete your account registration.\n\nIf you require any support, please contact your Admin.\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "3", title: "Admin Notice of Member Invitation", reminderHours: "N/A", enabled: true, subject: "Notice To Admin of Member Invitation", body: "Hi <b>Admin</b>,\n\nThis to inform you that <b>{invitedUser}</b> has invited <b>{invite_user}</b> to join the Savvey Savers Club.\nPlease log into the platform to see more details.\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "4", title: "Update Saving Commitment", reminderHours: "N/A", enabled: true, subject: "Changes to Your Savings Commitment Details", body: "Dear <b>{name}</b>,\n\nThere has been an update to your collection month, please log into your savings portal to view the details.\nPlease contact your dedicated Savings Portal Administrator if you require any support.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "5", title: "Savings Commitment Finalisation To Admin", reminderHours: "N/A", enabled: true, subject: "Savings Goal Finalized by Member", body: "Hi <b>Admin</b>,\n\nMember <b>{memberName}</b> has finalized their savings goals for the year.\nPlease log into the platform to review their commitment cycle.\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "6", title: "Savings Commitment Finalisation To Member", reminderHours: "N/A", enabled: true, subject: "Congratulations on Setting up Your Savings Goals for the Year!", body: "Dear <b>{memberName}</b>,\n\nCongratulations on taking the first step towards your savings journey by setting up your savings goals on the Savvey Savers Network platform!\nPlease log into the platform <a href=\"{loginUrl}\" target=\"_blank\">{loginUrl}</a> to see your savings commitment details.\nIf you have any queries, please reach out to your dedicated Platform Admin.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "7", title: "Hurry, Join the Savvey Savers Club! Reminder 1", reminderHours: "12", enabled: true, subject: "Hurry, Join the Savvey Savers Club!", body: "Dear <b>{name}</b>,\n\nThis a reminder to finalise your registration on the Savvey Savers Platform.\nIf you are having issues with registering, please contact our Platform Admin Team by sending an email to 'admin@savveysavers.com'.\nWe can not wait for you to join the Savvey Savers Club!\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "8", title: "Hurry, Join the Savvey Savers Club! Reminder 2", reminderHours: "168", enabled: true, subject: "Last Chance to Join the Savvey Savers Club", body: "Dear <b>{name}</b>,\n\nThis a final reminder to finalise your registration on the Savvey Savers Platform.\nIf you are having issues with registering, please contact our Platform Admin Team by sending an email to 'admin@savveysavers.com'.\nPlease note that your registration link will no longer be valid after 48 hours of you receiving this message.\nWe can not wait for you to join the Savvey Savers Club!\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "9", title: "Last Chance to Join the Savvey Savers Club Reminder 3", reminderHours: "336", enabled: true, subject: "Last Chance to Join the Savvey Savers Club", body: "Dear <b>{name}</b>,\n\nThis a final reminder to finalise your registration on the Savvey Savers Platform.\nIf you are having issues with registering, please contact our Platform Admin Team by sending an email to 'admin@savveysavers.com'.\nPlease note that your registration link will no longer be valid after 48 hours of you receiving this message.\nWe can not wait for you to join the Savvey Savers Club!\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "10", title: "Create Savings Commitment Reminder 1", reminderHours: "48", enabled: true, subject: "Please Finalise Your Savings Commitment", body: "Dear <b>{name}</b>,\n\nThis a reminder to finalise setup of your Savings Commitment on the Savvey Savers Platform.\nYou can do this by simply logging into the platform <a href=\"{url}\" target=\"_blank\">{url}</a> and entering the required details.\nIf you are having issues doing this, please contact our Platform Admin Team by sending an email to 'admin@savveysavers.com'.\nWe can not wait for you to achieve all your savings goals with the rest of the Savvey Savers Club!\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "11", title: "Create Saving Commitment Reminder 2", reminderHours: "96", enabled: true, subject: "Please Finalise Your Savings Commitment", body: "Dear <b>{name}</b>,\n\nThis a reminder to finalise setup of your Savings Commitment on the Savvey Savers Platform.\nYou can do this by simply logging into the platform <a href=\"{url}\" target=\"_blank\">{url}</a> and entering the required details.\nIf you are having issues doing this, please contact our Platform Admin Team by sending an email to 'admin@savveysavers.com'.\nWe can not wait for you to achieve all your savings goals with the rest of the Savvey Savers Club!\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "12", title: "Create Saving Commitment Reminder 3", reminderHours: "144", enabled: true, subject: "There is Still Time to Finalise Your Savings Commitment", body: "Dear <b>{name}</b>,\n\nThere is still time to finalise your Savings Commitment on the Savvey Savers Platform.\nYou can do this by simply logging into <a href=\"{url}\" target=\"_blank\">{url}</a> and entering the required details.\nIf you are having issues doing this, please contact our Platform Admin Team by sending an email to 'admin@savveysavers.com'.\nWe can not wait for you to achieve all your savings goals with the rest of the Savvey Savers Club!\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "13", title: "Due Payment Reminder (168 Hours)", reminderHours: "168", enabled: true, subject: "Payment Reminder", body: "Dear <b>{name}</b>,\n\nPlease be reminded that your savings payment for the month of {current_month} is due.\nTo ensure that we can release funds to the Network members due a collection this month in a timely manner, we kindly ask that you submit your payment within the next 24 hours.\nWe will never ask for your bank details via email or text message, if you receive such a request, disregard and delete the message and notify your dedicated Platform Admin as soon as possible, so that the relevant action can be taken.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "14", title: "Due Payment Reminder", reminderHours: "N/A", enabled: true, subject: "Payment Reminder", body: "Dear <b>{name}</b>,\n\nPlease be reminded that your savings payment for the month of {current_month} is due.\nTo ensure that we can release funds to the Network members due a collection this month in a timely manner, we kindly ask that you submit your payment within the next 24 hours.\nWe will never ask for your bank details via email or text message, if you receive such a request, disregard and delete the message and notify your dedicated Platform Admin as soon as possible, so that the relevant action can be taken.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "15", title: "Over Due Payment Reminder", reminderHours: "N/A", enabled: true, subject: "Payment Reminder", body: "Dear <b>{name}</b>,\n\nPlease be reminded that your savings payment for the month of {current_month} is due.\nTo ensure that we can release funds to the Network members due a collection this month in a timely manner, we kindly ask that you submit your payment within the next 24 hours.\nWe will never ask for your bank details via email or text message, if you receive such a request, disregard and delete the message and notify your dedicated Platform Admin as soon as possible, so that the relevant action can be taken.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "16", title: "Saving Commitment Request Rejected", reminderHours: "N/A", enabled: true, subject: "Saving Commitment Request Rejected", body: "Hello <b>{name}</b>,\n\nYour request to harvest your savings in {month_year} has been rejected by your Platform Admin. This is most likely because they have not been able to swap turns with another network member to accommodate your request. Please log into the platform and navigate to your Savings Commitment page to see more details and choose a different month.\n\nKind Regards,\nSavvey Savers Network Team" },
    { id: "17", title: "Complete Saving Commitment", reminderHours: "N/A", enabled: true, subject: "Complete Saving Commitment", body: "Dear <b>{savers_name}</b>,\n\nYour Saving commitment has been completed successfully. Now you can review your Savings commitment details.\n\nName: {savers_name}\nApproved Month: {month_name}\nRequested Amount: £{amount}\nSaving Goal: {saving_goal}\n\nIf you require any assistance, please contact your Administrator.\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "18", title: "Savvey Savers Proposal Request", reminderHours: "N/A", enabled: true, subject: "Savvey Savers Proposal Request", body: "Hello <b>{receiver_name}</b>,\n\nIt has not been possible to accommodate your request to harvest your savings in {from_month_name} {collection_year}, this is most likely because your Platform Admin has not been able to swap turns with another network member. However, your Platform Admin can offer you {to_month_name}. You can either accept the proposed month or navigate to your Savings Commitment page to see more details and choose a different month.\n\nThank you,\nSavvey Savers Network Support" },
    { id: "19", title: "Savvey Savers Saving Commitment Final Confirmation", reminderHours: "N/A", enabled: true, subject: "Savvey Savers Saving Commitment Final Confirmation", body: "Dear <b>{savers_name}</b>,\n\nYou can review your Final Savings commitment and collection information below. If you identify any discrepancies or require corrections, kindly inform us with the accurate details.\n\nName: {savers_name}\nApproved Month: {month_name}\nRequested Amount: £{amount}\nSaving Goal: {saving_goal}\n\nIf you require any assistance, please contact your Administrator.\n\nKind Regards,\nSavvey Savers Network Support." },
    { id: "20", title: "Savvey Savers Correction Details Updated", reminderHours: "N/A", enabled: true, subject: "Savvey Savers Correction Details Updated", body: "Dear <b>{savers_name}</b>,\n\nThis is to inform you that the correction details you provided have been successfully updated in our records. Kindly review the updated information below. If any further changes are required, please do not hesitate to contact the administrator.\n\nName: {savers_name}\nApproved Month: {month_name}\nRequested Amount: £{amount}\nSaving Goal: {saving_goal}\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "21", title: "Saving Commitment Approved", reminderHours: "N/A", enabled: true, subject: "Saving Commitment Approved", body: "Dear Admin,\n\nYour requested saving commitment month has been approved by admin with the below information:\n\nName: {savers_name}\nApproved Month: {month_name}\nRequested Amount: £{amount}\nSaving Goal: {saving_goal}\n\nIf you require any assistance, please contact your Administrator.\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "22", title: "Monthly Payment Received", reminderHours: "N/A", enabled: true, subject: "Your Monthly Payment has been Received", body: "Dear Member,\n\nThis is confirmation that your savings payment for the month of {fullMonthName} has been received.\nThis is just a notification message and you do not need to take any further action.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "23", title: "Harvest Release Email", reminderHours: "N/A", enabled: true, subject: "Congratulations, your Harvest is in!", body: "Dear <b>{name}</b>,\n\nWe are pleased to announce that your Savings Harvest has been released to your nominated bank account in order to help you meet your savings goal of {saving_goal}!\nTo see more details and confirm receipt of your funds, please log into <a href=\"{url}\" target=\"_blank\">{url}</a> within the next 24 hours.\nPlease be informed that although your harvest has come in, you are required to continue to make your monthly payments until the end of the year, unless your collection month is December.\nIf you have any queries, please contact your dedicated Platform Admin. We hope that you are as excited as we are about using your harvest to achieve your savings goals!\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "24", title: "Member Received Harvest Payment Receipt Notice", reminderHours: "N/A", enabled: true, subject: "Harvest Payment Receipt Notice", body: "Dear Platform Admin,\n\nThis message is to notify that {name} ({uniqueId}) has confirmed receipt of their Savings Harvest payment to their nominated bank account.\nPlease log into the platform to see more details.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Support" },
    { id: "25", title: "Cancelled Saving Commitment", reminderHours: "N/A", enabled: true, subject: "Cancelled Saving Commitment", body: "Dear <b>{name}</b>,\n\nYour savings commitment of £{amount} monthly scheduled for harvest in {collection_month} has been cancelled.\nIf you believe this has been cancelled in error, please contact your Network Relationship Manager as soon as possible.\n\nKind Regards,\nSavvey Savers Network Support" },
    { id: "26", title: "Waiting List Request", reminderHours: "N/A", enabled: true, subject: "Thanks for Joining our Waiting List", body: "Dear <b>{first_name}</b>,\n\nThank you for joining our savings club waiting list.\nOne of our Relationship Managers will contact you on the phone number you provided at time of registration.\n\nName: {first_name} {last_name}\nEmail: {email}\nPhone: {phone}\nSavings Commitment: £{savings_commitment}\nReferred By: {referred_by}\n\nBest Wishes,\nOnboarding Team\nSavvey Savers Network" },
    { id: "27", title: "Overdue Payment Reminder Email", reminderHours: "N/A", enabled: true, subject: "Overdue Payment Reminder", body: "Dear <b>{name}</b>,\n\nThis is to inform you that your payment for {current_month} is now overdue. In order to avoid late payment charges and to ensure that we can release funds to the Network members due a collection this month in a timely manner, we kindly ask that you submit your payment within the next 24 hours please.\n\nIf you continue to delay payments, we may be forced to remove you from the Network as stipulated in the terms of your Membership Agreement.\n\nPlease note that we will never ask for your bank details via email or text messaging, if you receive such a request, please disregard and delete the message and notify your dedicated Platform Admin as soon as possible so that the relevant action can be taken.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network" },
    { id: "28", title: "Annual Membership Fee", reminderHours: "N/A", enabled: true, subject: "Annual Membership Fee", body: "Dear Savvey Saver,\n\nYour annual Network membership fee of £{total_amount} for the year {payment_year} is due.\nPlease make payment to the bank account provided to you by your relationship manager to ensure that your collection slot for the year is guaranteed.\n\nKind Regards,\nPlatform Support\nSavvey Savers" },
    { id: "29", title: "Membership Fee Payment Confirmation", reminderHours: "N/A", enabled: true, subject: "Membership Fee Payment Confirmation", body: "Dear Savvey Saver,\n\nThis is to confirm that your Network membership and/or administration fee for {membership_year}, paid on {payment_received_date} has been received.\nThank you for your payment, we look forward to embarking on this savings journey with you.\n\nKind Regards,\nPlatform Support\nSavvey Savers Network Limited" },
    { id: "30", title: "Member Removal after Breach", reminderHours: "N/A", enabled: true, subject: "Notice of Membership Termination", body: "Dear {{MemberName}},\n\nFollowing a breach of one or more terms of the Savvey Savers Collective Membership Agreement, we have made the difficult decision to terminate your membership of Savvey Savers Network Limited.\n\nAs a result, your access to the Members’ Portal has now been deactivated, and you will no longer be able to sign in using your existing login credentials.\n\nThis decision was not made lightly. We sincerely thank you for your time as a member and hope you continue to make saving a priority in the future.\n\nIf you have any questions regarding this decision, please contact your Dedicated Relationship Manager.\n\nKind regards,\nMembership Compliance Team\nSavvey Savers Collective" },
    { id: "31", title: "Leaving Member", reminderHours: "N/A", enabled: true, subject: "Confirmation of Membership Closure", body: "Dear {{MemberName}},\n\nFollowing your request to leave Savvey Savers Collective, your membership has now been closed and your access to the Members’ Portal has been deactivated.\n\nYou are always welcome to rejoin the Network in the future. In the meantime, you can continue to visit our website to stay up to date with the latest news and activities.\n\nThank you for being part of the Savvey Savers Network. We wish you every success in your savings journey and hope to welcome you back in the future.\n\nKind regards,\nPlatform Support\nSavvey Savers Collective" },
    { id: "32", title: "Inactive Member", reminderHours: "N/A", enabled: true, subject: "Your Membership Has Been Deactivated", body: "Dear {{MemberName}},\n\nDue to an extended period of inactivity, your access to the Members’ Portal has been deactivated.\n\nYou’re always welcome to return to Savvey Savers Collective in the future. If you would like to rejoin, please contact your Dedicated Relationship Manager, who will be happy to assist you. You can also continue to visit our website to stay up to date with the latest news and activities.\n\nWe wish you every success in your savings journey and hope to welcome you back in the future.\n\nKind regards,\nPlatform Support\nSavvey Savers Collective" }
  ];

  const dbEmailTemplates = (await db.setting.findUnique({ where: { key: 'emailTemplates' } }))?.value || [];
  const existingIds = new Set((dbEmailTemplates as any[]).map((t: any) => t.id));
  const emailTemplates = [
    ...dbEmailTemplates,
    ...defaultEmailTemplates.filter((t) => !existingIds.has(t.id))
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
      await db.setting.create({
        key,
        value
      });
    }

    await db.auditLog.create({ data: {
      action: 'ADMIN_SETTINGS_UPDATE',
      details: `Admin updated settings configuration for key: ${key}.`,
      userId: 'usr_admin'
    } });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Update settings error:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
