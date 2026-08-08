import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'savvey-session';

const secretKey = process.env.JWT_SECRET;
if (!secretKey && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is missing in production');
}
const encodedKey = new TextEncoder().encode(secretKey || 'dev-fallback-key-savvey-savers-2026');

export async function createSessionCookie(payload: any): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5d')
    .sign(encodedKey);
  
  return jwt;
}

export async function verifyToken(token: string): Promise<{ id: string; email?: string; role: 'ADMIN' | 'MEMBER' } | null> {
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'MEMBER',
    };
  } catch (error) {
    console.error('Failed to verify token:', error);
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return null;
  return await verifyToken(session);
}
