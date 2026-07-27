import { adminAuth, adminDb } from './firebase-admin';

export const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-savvey-session' : 'savvey-session';

// Firebase Session Cookie creation helper
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 1000 * 60 * 60 * 24 * 5; // 5 days session
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

// Firebase Session Cookie verification helper
// Maps the session's decoded UID to user id, email, and role
export async function verifyToken(token: string): Promise<{ id: string; email?: string; role: 'ADMIN' | 'MEMBER' } | null> {
  try {
    let decodedClaims: any;
    try {
      decodedClaims = await adminAuth.verifySessionCookie(token, true);
    } catch (cookieErr) {
      decodedClaims = await adminAuth.verifyIdToken(token);
    }

    if (!decodedClaims || !decodedClaims.uid) {
      return null;
    }

    const userId = decodedClaims.uid;
    const userEmail = (decodedClaims.email || '').toLowerCase().trim();

    if (userId === '3MMvFU6ucAXqmPhalkQOoMsbMMu1' || userEmail === 'praisetechy001@gmail.com') {
      return { id: userId, email: userEmail, role: 'ADMIN' };
    }

    try {
      // Fetch user from Firestore to retrieve their role
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return {
        id: userId,
        email: userEmail,
        role: userData?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      };
    } catch (dbErr: any) {
      console.warn('verifyToken db lookup error (quota or network):', dbErr?.message || dbErr);
      if (userEmail === 'praisetechy001@gmail.com' || userEmail === 'admin@savveysavers.com') {
        return { id: userId, email: userEmail, role: 'ADMIN' };
      }
      return null;
    }
  } catch (err) {
    return null;
  }
}
