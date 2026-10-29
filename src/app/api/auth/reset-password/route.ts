import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTemplatedEmail } from '@/lib/email';


export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in Database (case-insensitive)
    const user = await db.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      // Mitigate user enumeration by returning a success status even if email is not found
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a password reset link has been dispatched. Please check your inbox and Spam/Junk folder.'
      });
    }

    // Generate a unique reset token in the M-XXXXXX format
    const random6Digit = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = `M-${random6Digit}`;
    
    // Set token to expire in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to user and invalidate existing password until reset is completed
    await db.user.update({
      where: { id: user.id },
      data: {
        invitationId: resetToken,
        invitationExpiresAt: expiresAt,
        passwordHash: 'reset_pending'
      }
    });

    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    let origin = envAppUrl;
    if (!origin) {
      const host = request.headers.get('host') || 'savveysavers.com';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      origin = `${protocol}://${host}`;
    }
    
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    const sendResult = await sendTemplatedEmail("1", normalizedEmail, {
      name: user.name,
      reacturl: resetLink
    });

    if (!sendResult.success) {
      const errMsg = 'error' in sendResult ? (sendResult as any).error : 'Failed to send reset email';
      return NextResponse.json({ error: `Failed to send email: ${errMsg}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `A password reset link has been dispatched to ${normalizedEmail}. Please check your inbox and Spam/Junk folder.`
    });

  } catch (err: any) {
    console.error('Password reset endpoint error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
