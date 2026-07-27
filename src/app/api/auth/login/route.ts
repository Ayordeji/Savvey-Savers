import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionCookie, COOKIE_NAME } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user in Prisma DB
    const user = await db.user.findUnique({ 
      where: { email: normalizedEmail } 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
       return NextResponse.json(
        { error: 'Your account is inactive. Please contact administration.' },
        { status: 403 }
      );
    }

    // Compare passwords
    let isValidPassword = false;
    
    // Check if the hash starts with $2 (bcrypt standard format)
    if (user.passwordHash && user.passwordHash.startsWith('$2')) {
       isValidPassword = await bcrypt.compare(password, user.passwordHash);
    } else {
       // Support raw password login for manually seeded users (like our script did 'Password123!')
       isValidPassword = password === user.passwordHash;
       
       // Note: in a production app, we would rehash the raw password here and update it.
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } catch (updateErr) {
      console.warn('Failed to update lastLoginAt:', updateErr);
    }

    // Generate JWT Session Cookie
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    const sessionCookie = await createSessionCookie(payload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      }
    });

    // Set cookie headers
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 5, // 5 days
    });

    // Record login audit event
    try {
      await db.auditLog.create({
        data: {
          action: 'USER_LOGIN',
          details: `User ${user.email} logged in.`,
          userId: user.id
        }
      });
    } catch (auditErr) {
      console.warn('Login audit log non-blocking notice:', auditErr);
    }

    return response;
  } catch (err: any) {
    console.error('Login API error:', err);
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
