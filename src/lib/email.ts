import { Resend } from 'resend';
import { db } from './db';
import { defaultEmailTemplates, EmailTemplate } from './emailTemplates';

const resendApiKey = process.env.RESEND_API_KEY;

export function getMailFrom(): string {
  const envFrom = process.env.MAIL_FROM;
  if (!envFrom || envFrom.includes('crevianstudios.com') || envFrom.includes('resend.dev')) {
    return 'Savvey Savers <admin@savveysavers.com>';
  }
  return envFrom;
}

// Initialize Resend client
const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (!resendApiKey) {
  console.warn('[Resend Email Warning]: RESEND_API_KEY environment variable is not defined. Emails will be logged locally in Database mockEmails collection but not sent.');
}

function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function wrapInEmailTemplate({
  subject,
  bodyHtml,
}: {
  subject: string;
  bodyHtml: string;
}): string {
  // If the body already looks like a complete HTML document, don't double wrap
  if (bodyHtml.toLowerCase().includes('<!doctype') || bodyHtml.toLowerCase().includes('<html')) {
    return bodyHtml;
  }

  // Convert basic line breaks if not already containing paragraph tags
  let formattedBody = bodyHtml;
  if (!bodyHtml.includes('<p>') && !bodyHtml.includes('<div>')) {
    formattedBody = bodyHtml
      .split('\n\n')
      .map(para => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155;">${para.replace(/\n/g, '<br />')}</p>`)
      .join('');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    a { color: #0f766e; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #042f2e 0%, #0f766e 100%); padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">SAVVEY SAVERS</h1>
        <p style="margin: 4px 0 0 0; color: #99f6e4; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Peer-to-Peer Savings Platform</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px; color: #1e293b; font-size: 15px; line-height: 1.6;">
        ${formattedBody}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 6px 0;">Savvey Savers Network Limited &bull; Official Account Notification</p>
        <p style="margin: 0;">If you have any questions, please contact <a href="mailto:admin@savveysavers.com" style="color: #0f766e; text-decoration: underline;">admin@savveysavers.com</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail({
  to,
  subject,
  body,
  html,
}: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}) {
  try {
    const plainText = stripHtmlToPlainText(body);
    const emailHtml = wrapInEmailTemplate({
      subject,
      bodyHtml: html || body,
    });

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
        from: getMailFrom(),
        to,
        reply_to: 'admin@savveysavers.com',
        subject,
        text: plainText,
        html: emailHtml
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
