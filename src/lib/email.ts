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

  // Convert basic line breaks if not already containing paragraph tags or tables
  let formattedBody = bodyHtml;
  if (!bodyHtml.includes('<p>') && !bodyHtml.includes('<div>') && !bodyHtml.includes('<table')) {
    formattedBody = bodyHtml
      .split(/\n{2,}/)
      .map(para => `<p style="margin: 0 0 16px 0; line-height: 1.65; color: #1e293b; font-size: 15px;">${para.replace(/\n/g, '<br />')}</p>`)
      .join('');
  } else {
    // If it has paragraphs or tables, convert double newlines outside tags into spacing
    formattedBody = formattedBody.replace(/\n\n+/g, '<br /><br />');
  }

  const logoUrl = 'https://www.savveysavers.com/logo_new-removebg-preview.png';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100%; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a { color: #0E4F45; text-decoration: underline; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-cell { padding: 26px 20px !important; }
      .header-cell { padding: 26px 16px 22px 16px !important; }
      .footer-cell { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <!-- Centered Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" bgcolor="#0E4F45" class="header-cell" style="background-color: #0E4F45; background-image: linear-gradient(135deg, #042F2E 0%, #0E4F45 100%); padding: 32px 24px 28px 24px; text-align: center;">
              
              <!-- Circular Logo Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 14px auto;">
                <tr>
                  <td align="center" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 50%; width: 68px; height: 68px; text-align: center; vertical-align: middle; padding: 6px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);">
                    <a href="https://www.savveysavers.com" target="_blank" style="text-decoration: none; display: block;">
                      <img
                        src="${logoUrl}"
                        alt="Savvey Savers"
                        width="54"
                        height="54"
                        style="display: block; width: 54px; height: 54px; max-width: 54px; max-height: 54px; border: 0; outline: none; text-decoration: none; margin: 0 auto;"
                      />
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Brand Name -->
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #ffffff !important; letter-spacing: 0.8px; line-height: 1.2; margin: 0; text-transform: uppercase;">
                SAVVEY SAVERS
              </div>

              <!-- Brand Tagline -->
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #99F6E4 !important; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; line-height: 1.4;">
                Peer-to-Peer Savings Platform
              </div>
            </td>
          </tr>

          <!-- Gold Brand Accent Line -->
          <tr>
            <td bgcolor="#D4AF37" style="background-color: #D4AF37; height: 3px; font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td bgcolor="#ffffff" class="content-cell" style="background-color: #ffffff; padding: 36px 32px; color: #1E293B; font-size: 15px; line-height: 1.65; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              ${formattedBody}
            </td>
          </tr>

          <!-- Footer (Savvey Savers Collective Footnote) -->
          <tr>
            <td align="left" bgcolor="#FAF9F6" class="footer-cell" style="background-color: #FAF9F6; padding: 28px 32px; border-top: 1px solid #ECE8E2; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <!-- Green Accent Bar -->
              <div style="width: 42px; height: 4px; background-color: #0E4F45; border-radius: 2px; margin: 0 0 16px 0;"></div>

              <!-- Collective Title -->
              <div style="font-size: 20px; font-weight: 800; color: #0E4F45; letter-spacing: -0.01em; line-height: 1.25; margin: 0 0 16px 0;">
                Savvey Savers Collective
              </div>

              <!-- Divider Line -->
              <div style="height: 1px; background-color: #ECE8E2; width: 100%; margin: 16px 0;"></div>

              <!-- Contact Rows -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin: 0;">
                <tr>
                  <td style="padding: 6px 12px 6px 0; width: 22px; vertical-align: middle;">
                    <img
                      src="https://www.savveysavers.com/images/icon-email.png"
                      alt="Email"
                      width="18"
                      height="18"
                      style="display: block; width: 18px; height: 18px; border: 0; outline: none; margin: 0;"
                    />
                  </td>
                  <td style="padding: 6px 0; vertical-align: middle; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <a href="mailto:admin@savveysavers.com" style="color: #1E293B; text-decoration: none; font-weight: 500;">admin@savveysavers.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px 6px 0; width: 22px; vertical-align: middle;">
                    <img
                      src="https://www.savveysavers.com/images/icon-globe.png"
                      alt="Website"
                      width="18"
                      height="18"
                      style="display: block; width: 18px; height: 18px; border: 0; outline: none; margin: 0;"
                    />
                  </td>
                  <td style="padding: 6px 0; vertical-align: middle; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <a href="https://www.savveysavers.com" target="_blank" style="color: #1E293B; text-decoration: none; font-weight: 500;">www.savveysavers.com</a>
                  </td>
                </tr>
              </table>

              <!-- Divider Line -->
              <div style="height: 1px; background-color: #ECE8E2; width: 100%; margin: 16px 0;"></div>

              <!-- Legal Entity Subtitle -->
              <div style="font-size: 14px; font-weight: 500; color: #64748B; margin: 0; line-height: 1.4;">
                Savvey Savers Network Limited
              </div>
            </td>
          </tr>
        </table>
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
        replyTo: 'admin@savveysavers.com',
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
    
    // For payment confirmation email template 22, ensure enabled is true and updated body is used
    if (templateId === "22") {
      const defaultTpl22 = defaultEmailTemplates.find(t => t.id === "22");
      if (template) {
        template.enabled = true;
        if (!template.body.includes('{amount}') && defaultTpl22) {
          template.subject = defaultTpl22.subject;
          template.body = defaultTpl22.body;
        }
      } else if (defaultTpl22) {
        template = { ...defaultTpl22, enabled: true };
      }
    }

    // For harvest release email template 23, ensure enabled is true and updated branded body is used
    if (templateId === "23") {
      const defaultTpl23 = defaultEmailTemplates.find(t => t.id === "23");
      if (template) {
        template.enabled = true;
        if (defaultTpl23 && (!template.body.includes('Confirm Receipt in Portal') || template.body.includes('of {saving_goal}'))) {
          template.subject = defaultTpl23.subject;
          template.body = defaultTpl23.body;
        }
      } else if (defaultTpl23) {
        template = { ...defaultTpl23, enabled: true };
      }
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

    // Handle {saving_goal} gracefully for Harvest emails (avoiding awkward "of Savings Goal!")
    if (templateId === "23") {
      const rawGoal = (variables.saving_goal || '').trim();
      if (!rawGoal || rawGoal.toLowerCase() === 'savings goal') {
        body = body.replace(/of\s*\{saving_goal\}/gi, '');
        body = body.replace(/\{saving_goal\}/gi, '');
      } else if (rawGoal.startsWith(' of ') || rawGoal.startsWith('of ')) {
        const cleaned = rawGoal.startsWith(' of ') ? rawGoal : ` ${rawGoal}`;
        body = body.replace(/of\s*\{saving_goal\}/gi, cleaned);
        body = body.replace(/\{saving_goal\}/gi, cleaned);
      } else {
        body = body.replace(/of\s*\{saving_goal\}/gi, ` of ${rawGoal}`);
        body = body.replace(/\{saving_goal\}/gi, ` of ${rawGoal}`);
      }
    }

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
