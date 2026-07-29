import { Resend } from 'resend';
import { db } from './db';
import { defaultEmailTemplates, EmailTemplate } from './emailTemplates';

const resendApiKey = process.env.RESEND_API_KEY;
const mailFrom = process.env.MAIL_FROM || 'onboarding@resend.dev'; // fallback standard Resend domain if none specified

// Initialize Resend client
const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (!resendApiKey) {
  console.warn('[Resend Email Warning]: RESEND_API_KEY environment variable is not defined. Emails will be logged locally in Database mockEmails collection but not sent.');
}

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  try {
    // Record email in local database for developer dashboard previewing
    await db.mockEmail.create({
      data: {
        to,
        subject,
        body,
        sentAt: new Date().toISOString()
      }
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

export async function sendTemplatedEmail(
  templateId: string,
  to: string,
  variables: Record<string, string>
) {
  try {
    const dbEmailTemplatesStr = await db.setting.findUnique({ where: { key: 'emailTemplates' } });
    const dbEmailTemplates = (dbEmailTemplatesStr?.value as any[]) || [];
    
    // Find the template in DB, or fallback to default
    let template = dbEmailTemplates.find((t: any) => t.id === templateId) as EmailTemplate | undefined;
    if (!template) {
      template = defaultEmailTemplates.find(t => t.id === templateId);
    }
    
    if (!template) {
      console.warn(`[sendTemplatedEmail] Template ID ${templateId} not found.`);
      return { success: false, error: 'Template not found' };
    }
    
    if (!template.enabled) {
      console.log(`[sendTemplatedEmail] Template ID ${templateId} is disabled in settings. Skipping email to ${to}.`);
      return { success: true, messageId: 'skipped-disabled' };
    }
    
    let subject = template.subject;
    let body = template.body;
    
    for (const [key, value] of Object.entries(variables)) {
      // replace {key}
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
      
      // replace {{key}} just in case (some templates have {{MemberName}})
      const doubleRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(doubleRegex, value);
      body = body.replace(doubleRegex, value);
    }
    
    return await sendEmail({ to, subject, body });
  } catch (err: any) {
    console.error(`[sendTemplatedEmail] Error parsing template ${templateId}`, err);
    return { success: false, error: err.message || err };
  }
}
