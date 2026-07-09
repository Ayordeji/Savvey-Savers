import { Resend } from 'resend';
import { db } from './db';

const resendApiKey = process.env.RESEND_API_KEY;
const mailFrom = process.env.MAIL_FROM || 'onboarding@resend.dev'; // fallback standard Resend domain if none specified

// Initialize Resend client
const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (!resendApiKey) {
  console.warn('[Resend Email Warning]: RESEND_API_KEY environment variable is not defined. Emails will be logged locally in Firestore mockEmails collection but not sent.');
}

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  try {
    // Record email in local database for developer dashboard previewing
    await db.mockEmails.create({
      to,
      subject,
      body,
      sentAt: new Date().toISOString()
    });

    if (resend) {
      const response = await resend.emails.send({
        from: mailFrom,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br />')
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log(`[EMAIL SENT SUCCESS] Resend Message ID: ${response.data?.id}`);
      return { success: true, messageId: response.data?.id };
    } else {
      console.log(`[MOCK EMAIL LOGGED] To: ${to}, Subject: ${subject}`);
      return { success: true, messageId: 'mock-resend-id' };
    }
  } catch (err: any) {
    console.error('[EMAIL SENDING FAILED]', err);
    return { success: false, error: err.message || err };
  }
}
