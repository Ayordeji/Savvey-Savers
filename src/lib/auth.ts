import { adminAuth, adminDb } from './firebase-admin';

export const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-savvey-session' : 'savvey-session';

// Firebase Session Cookie creation helper
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 1000 * 60 * 60 * 24 * 5; // 5 days session
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

// Firebase Session Cookie verification helper
// Maps the session's decoded UID to user id and role
export async function verifyToken(token: string): Promise<{ id: string; role: 'ADMIN' | 'MEMBER' } | null> {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(token, true);
    const userId = decodedClaims.uid;

    // Fetch user from Firestore to retrieve their role
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userId,
      role: userData?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
    };
  } catch (err) {
    return null;
  }
}
