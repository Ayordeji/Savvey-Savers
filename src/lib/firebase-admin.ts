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

// Robust private key cleaner that strips any outer/inner quotes and normalizes newlines
let cleanPrivateKey = (privateKey || '').trim();
cleanPrivateKey = cleanPrivateKey.replace(/["']/g, ''); // strip any quotes pasted by mistake
cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n'); // replace escaped newlines with actual newlines

console.log('--- Firebase Private Key Debug ---');
console.log('Is Raw Key Defined?:', !!privateKey);
if (privateKey) {
  console.log('Raw Key Length:', privateKey.length);
  console.log('Raw Key Starts With:', privateKey.substring(0, 40));
  console.log('Raw Key Ends With:', privateKey.substring(privateKey.length - 40));
  console.log('Clean Key Length:', cleanPrivateKey.length);
  console.log('Clean Key Starts With:', cleanPrivateKey.substring(0, 40));
  console.log('Clean Key Ends With:', cleanPrivateKey.substring(cleanPrivateKey.length - 40));
}
console.log('----------------------------------');

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
