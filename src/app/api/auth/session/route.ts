import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.json({ loggedIn: false });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const user = await db.users.findUnique({ where: { id: payload.id } });
    if (!user) {
      const response = NextResponse.json({ loggedIn: false });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.json({
      loggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ loggedIn: false });
  }
}
