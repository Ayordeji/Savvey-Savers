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

    // Check if user exists in Database
    const user = await db.user.findFirst({ where: { email: normalizedEmail } });
    if (!user) {
      // Mitigate user enumeration by returning a success status even if email is not found
      return NextResponse.json({ success: true, message: 'If this email is registered, a password reset link has been sent.' });
    }

    // Generate a unique reset token in the M-XXXXXX format
    const random6Digit = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = `M-${random6Digit}`;
    
    // Set token to expire in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to user
    await db.user.update({
      where: { id: user.id },
      data: {
        invitationId: resetToken,
        invitationExpiresAt: expiresAt
      }
    });

    const host = request.headers.get('host') || 'savvey-savers.vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;
    
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    const sendResult = await sendTemplatedEmail("1", normalizedEmail, {
      name: user.name,
      reacturl: resetLink
    });

    if (!sendResult.success) {
      return NextResponse.json({ error: `Failed to send email: ${sendResult.error}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Password reset endpoint error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
