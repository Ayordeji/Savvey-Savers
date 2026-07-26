/**
 * Creates a Super Admin user in Firebase Auth + Firestore.
 * Run with: source .env && FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL" FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" npx tsx scripts/create_super_admin.ts
 */

import { adminAuth, adminDb } from '../src/lib/firebase-admin';

async function createSuperAdmin() {
  const email = 'praisetechy001@gmail.com';
  const password = 'sainteluyemi2002';
  const name = 'Praise';
  const phone = '+447000000000'; // placeholder
  const invitationId = 'M-000001'; // placeholder

  console.log(`\nCreating Super Admin: ${name} <${email}>...\n`);

  // 1. Create or retrieve Firebase Auth user
  let firebaseUid: string;
  try {
    const existing = await adminAuth.getUserByEmail(email);
    firebaseUid = existing.uid;
    console.log(`⚠️  Firebase Auth user already exists (uid: ${firebaseUid}). Updating password...`);
    await adminAuth.updateUser(firebaseUid, { password, displayName: name });
    console.log(`✅ Firebase Auth password updated.`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const created = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      firebaseUid = created.uid;
      console.log(`✅ Firebase Auth user created (uid: ${firebaseUid}).`);
    } else {
      throw err;
    }
  }

  // 2. Upsert Firestore user document
  const userRef = adminDb.collection('users').doc(firebaseUid);
  const existingDoc = await userRef.get();

  const userData = {
    id: firebaseUid,
    name,
    email: email.toLowerCase(),
    phone,
    role: 'ADMIN',
    isSuperAdmin: true,
    isActive: true,
    membershipFeeConfirmed: true,
    invitationId,
    permissions: [
      'DELETE_USER',
      'EDIT_USER',
      'VIEW_USER',
      'MANAGE_COMMITMENTS',
      'MANAGE_PAYMENTS',
      'MANAGE_SETTINGS',
      'VIEW_AUDIT_LOGS',
      'SEND_NOTIFICATIONS',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingDoc.exists) {
    await userRef.update({
      ...userData,
      // Preserve original createdAt if doc already exists
      createdAt: existingDoc.data()?.createdAt || userData.createdAt,
    });
    console.log(`✏️  Firestore user document updated.`);
  } else {
    await userRef.set(userData);
    console.log(`✅ Firestore user document created.`);
  }

  console.log(`\n🎉 Super Admin created successfully!`);
  console.log(`   Name:     ${name}`);
  console.log(`   Email:    ${email}`);
  console.log(`   UID:      ${firebaseUid}`);
  console.log(`   Role:     ADMIN (isSuperAdmin: true)`);
  console.log(`   Login at: https://savveysavers.com/login\n`);
}

createSuperAdmin().catch((err) => {
  console.error('❌ Error creating super admin:', err.message || err);
  process.exit(1);
});
