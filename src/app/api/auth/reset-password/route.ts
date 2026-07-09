import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in Firestore
    const user = await db.users.findFirst((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return NextResponse.json({ error: 'No user account found with this email address.' }, { status: 404 });
    }

    // Generate standard password reset link using Firebase Admin SDK
    let resetLink = '';
    try {
      resetLink = await adminAuth.generatePasswordResetLink(normalizedEmail);
    } catch (authErr: any) {
      console.error('Firebase Admin generatePasswordResetLink error:', authErr);
      return NextResponse.json({ error: `Firebase Auth error: ${authErr.message}` }, { status: 500 });
    }

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
