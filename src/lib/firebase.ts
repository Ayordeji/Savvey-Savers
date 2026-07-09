import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

const firebaseConfig = {
  apiKey: cleanString(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || 'mock-api-key',
  authDomain: cleanString(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || 'mock-auth-domain.firebaseapp.com',
  projectId: cleanString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 'mock-project-id',
  storageBucket: cleanString(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || 'mock-project-id.appspot.com',
  messagingSenderId: cleanString(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || '000000000000',
  appId: cleanString(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || '1:000000000000:web:0000000000000000000000',
};

if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.warn('[Firebase Client Warning]: NEXT_PUBLIC_FIREBASE_API_KEY is not defined. Firebase client-side SDK initialized with placeholders.');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;

