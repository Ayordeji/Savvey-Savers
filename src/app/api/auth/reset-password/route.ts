import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';


export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in Firestore
    const user = await db.user.findFirst({ where: { email: normalizedEmail } });
    if (!user) {
      // Mitigate user enumeration by returning a success status even if email is not found
      return NextResponse.json({ success: true, message: 'If this email is registered, a password reset link has been sent.' });
    }

    // Generate a unique reset token
    const { v4: uuidv4 } = require('uuid');
    const resetToken = uuidv4();
    
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
    
    const resetLink = `${origin}/activate?token=${resetToken}`;

    // Send the password reset email via Resend
    const emailSubject = 'Savvey Savers - Password Reset Request';
    const emailBody = `Hello ${user.name},\n\nYou requested a password reset for your Savvey Savers account.\n\nClick the link below to reset your password:\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nSavvey Savers Team`;

    const sendResult = await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      body: emailBody
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
