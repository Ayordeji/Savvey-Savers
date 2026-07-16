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
      // Mitigate user enumeration by returning a success status even if email is not found
      return NextResponse.json({ success: true, message: 'If this email is registered, a password reset link has been sent.' });
    }

    // Generate standard password reset link using Firebase Admin SDK
    let resetLink = '';
    try {
      const host = request.headers.get('host') || 'savvey-savers.vercel.app';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const origin = `${protocol}://${host}`;
      
      resetLink = await adminAuth.generatePasswordResetLink(normalizedEmail, {
        url: `${origin}/`
      });
    } catch (authErr: any) {
      console.error('Firebase Admin generatePasswordResetLink error:', authErr);
      let errorMsg = authErr.message || 'Unable to generate reset link.';
      if (errorMsg.includes('Unable to create the email action link') || errorMsg.includes('INTERNAL ASSERT FAILED')) {
        errorMsg = 'Unable to generate password reset link. Please ensure that "Email/Password" sign-in provider is enabled in your Firebase Console under Authentication > Sign-in method, and that your domain is whitelisted in "Authorized domains" under Settings.';
      }
      return NextResponse.json({ error: `Firebase Auth configuration issue: ${errorMsg}` }, { status: 500 });
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
