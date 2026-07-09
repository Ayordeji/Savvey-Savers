import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const cleanString = (str: string | undefined) => {
  if (!str) return '';
  let val = str.trim();
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.substring(1, val.length - 1);
  }
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.substring(1, val.length - 1);
  }
  return val;
};

const cleanProjectId = cleanString(projectId);
const cleanClientEmail = cleanString(clientEmail);
let cleanPrivateKey = cleanString(privateKey).replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (cleanProjectId && cleanClientEmail && cleanPrivateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: cleanProjectId,
        clientEmail: cleanClientEmail,
        privateKey: cleanPrivateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${cleanProjectId}.appspot.com`,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } else {
    console.warn('[Firebase Admin SDK Warning]: Missing credentials for Service Account (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). Initializing with default config.');
    admin.initializeApp({
      projectId: cleanProjectId || 'mock-project-id',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-project-id.appspot.com',
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export default admin;
