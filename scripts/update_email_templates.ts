import { db } from '../src/lib/db';

const updatedTemplates = [
  { id: "4", title: "Update Saving Commitment", reminderHours: "N/A", enabled: true, subject: "Edited Savings Commitment", body: "Dear {name},\n\nThere has been an update to your savings record.\n\nPlease log in to your Savings Portal to view the latest details. If you have any questions or require assistance, please contact your Dedicated Relationship Manager.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "6", title: "Savings Commitment Finalisation To Member", reminderHours: "N/A", enabled: true, subject: "Initial Savings Setup", body: "Dear {memberName},\n\nCongratulations, and welcome to the Savvey Savers Collective!\n\nYour savings goals have now been set up, marking the first step in your savings journey with us.\n\nPlease log in to your Savings Portal at {loginUrl} to view your savings commitment details.\n\nIf you have any questions or need assistance, please contact your Dedicated Relationship Manager.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "22", title: "Monthly Payment Received", reminderHours: "N/A", enabled: true, subject: "We’ve Received It", body: "Dear {name},\n\nWe are pleased to confirm that we have received your savings payment for <b>{fullMonthName}</b>.\n\nThis is a confirmation notice only, and no further action is required from you.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "25", title: "Cancelled Saving Commitment", reminderHours: "N/A", enabled: true, subject: "Cancelled Savings Commitment", body: "Dear {name},\n\nYour monthly savings commitment of £{amount}, scheduled for collection in {collection_month}, has been cancelled.\n\nIf you believe this cancellation was made in error, please contact your Network Relationship Manager as soon as possible.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "27", title: "Overdue Payment Reminder Email", reminderHours: "N/A", enabled: true, subject: "Overdue Payment Reminder – {current_month}", body: "Dear {name},\n\nYour {current_month} payment is now overdue.\n\nTo avoid late payment charges and ensure we can release this month’s collections to members on time, please make your payment within the next 24 hours.\n\nContinued late payments may result in your membership being terminated in accordance with your Membership Agreement.\n\nSecurity Reminder: We will never ask for your bank details by email or text. If you receive such a request, please ignore it and notify your dedicated Relationship Manager immediately.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "28", title: "Annual Membership Fee", reminderHours: "N/A", enabled: true, subject: "Fee Request", body: "Dear {name},\n\nYour {payment_year} Annual Membership Fee of £{total_amount} is now due.\n\nPlease make payment to the bank account provided by your Relationship Manager to secure your collection slot for the year.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "29", title: "Membership Fee Payment Confirmation", reminderHours: "N/A", enabled: true, subject: "Fee Payment Confirmation", body: "Dear {name},\n\nThank you for your payment.\n\nThis is to confirm that we have received your {membership_year} Membership Fee of £{amount} on {payment_received_date}.\n\nWe look forward to supporting you throughout your savings journey and thank you for choosing to be part of the Savvey Savers Collective.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "30", title: "Member Removal after Breach", reminderHours: "N/A", enabled: true, subject: "Notice of Membership Termination", body: "Dear {MemberName},\n\nFollowing a breach of one or more terms of the Savvey Savers Collective Membership Agreement, we have made the difficult decision to terminate your membership of Savvey Savers Network Limited.\n\nAs a result, your access to the Members’ Portal has now been deactivated, and you will no longer be able to sign in using your existing login credentials.\n\nThis decision was not made lightly. We sincerely thank you for your time as a member and hope you continue to make saving a priority in the future.\n\nIf you have any questions regarding this decision, please contact your Dedicated Relationship Manager.\n\nKind regards,\n\nMembership Compliance Team\nSavvey Savers Collective" },
  { id: "31", title: "Leaving Member", reminderHours: "N/A", enabled: true, subject: "Confirmation of Membership Closure", body: "Dear {MemberName},\n\nFollowing your request to leave Savvey Savers Collective, your membership has now been closed and your access to the Members’ Portal has been deactivated.\n\nYou are always welcome to rejoin the Network in the future. In the meantime, you can continue to visit our website to stay up to date with the latest news and activities.\n\nThank you for being part of the Savvey Savers Network. We wish you every success in your savings journey and hope to welcome you back in the future.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" },
  { id: "32", title: "Inactive Member", reminderHours: "N/A", enabled: true, subject: "Your Membership Has Been Deactivated", body: "Dear {MemberName},\n\nDue to an extended period of inactivity, your access to the Members’ Portal has been deactivated.\n\nYou’re always welcome to return to Savvey Savers Collective in the future. If you would like to rejoin, please contact your Dedicated Relationship Manager, who will be happy to assist you. You can also continue to visit our website to stay up to date with the latest news and activities.\n\nWe wish you every success in your savings journey and hope to welcome you back in the future.\n\nKind regards,\n\nPlatform Support\nSavvey Savers Collective" }
];

async function main() {
  const setting = await db.setting.findUnique({ where: { key: 'emailTemplates' } });
  
  if (setting && setting.value) {
    let currentTemplates = setting.value;
    
    // Update the templates in the database
    updatedTemplates.forEach(ut => {
      const idx = currentTemplates.findIndex(t => t.id === ut.id);
      if (idx !== -1) {
        currentTemplates[idx] = ut;
      } else {
        currentTemplates.push(ut);
      }
    });

    await db.setting.update({
      where: { key: 'emailTemplates' },
      data: { value: currentTemplates }
    });
    console.log('Successfully updated email templates in database.');
  } else {
    console.log('No existing emailTemplates setting found. Creating one...');
    // If not exists, fetch from default API or just insert these overrides?
    // Let's just insert these since the API merges them anyway.
    await db.setting.create({
      data: {
        key: 'emailTemplates',
        value: updatedTemplates
      }
    });
    console.log('Successfully created email templates in database.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => { /* connection is managed by pool */ });
