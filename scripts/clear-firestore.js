const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse .env manually
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const projectId = env['FIREBASE_PROJECT_ID'] || env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const clientEmail = env['FIREBASE_CLIENT_EMAIL'];
let privateKey = env['FIREBASE_PRIVATE_KEY'];

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

const db = admin.firestore();
const auth = admin.auth();

// The active Super Admin email to preserve
const PRESERVED_EMAIL = 'praisetechy001@gmail.com';

async function deleteCollection(collectionName) {
  console.log(`Clearing Firestore collection: '${collectionName}'...`);
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Cleared '${collectionName}'.`);
}

async function cleanUsers() {
  console.log('Cleaning user records...');
  const usersSnapshot = await db.collection('users').get();
  
  // 1. Get all Firebase Authentication users
  const authUsers = [];
  let nextPageToken;
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    authUsers.push(...listUsersResult.users);
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  // 2. Process Firebase Auth users
  for (const authUser of authUsers) {
    if (authUser.email === PRESERVED_EMAIL) {
      console.log(`Preserving Super Admin user in Firebase Auth: ${authUser.email} (UID: ${authUser.uid})`);
    } else {
      console.log(`Deleting user from Firebase Auth: ${authUser.email} (UID: ${authUser.uid})`);
      try {
        await auth.deleteUser(authUser.uid);
      } catch (err) {
        console.error(`Failed to delete Firebase Auth user ${authUser.uid}:`, err.message);
      }
    }
  }

  // 3. Process Firestore user documents
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    if (userData.email === PRESERVED_EMAIL) {
      console.log(`Preserving Super Admin user in Firestore: ${userData.email}`);
      // Ensure they have active, super admin status
      await doc.ref.update({
        role: 'ADMIN',
        isSuperAdmin: true,
        isActive: true
      });
    } else {
      console.log(`Deleting user document from Firestore: ${userData.email} (ID: ${doc.id})`);
      await doc.ref.delete();
    }
  }

  // Double check: if the preserved email is not in Auth/Firestore yet, warn or create it
  try {
    const userRecord = await auth.getUserByEmail(PRESERVED_EMAIL);
    const docRef = db.collection('users').doc(userRecord.uid);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.log(`Re-registering Super Admin document in Firestore for ${PRESERVED_EMAIL}`);
      await docRef.set({
        id: userRecord.uid,
        name: 'Super Admin',
        email: PRESERVED_EMAIL,
        phone: '1234567890',
        role: 'ADMIN',
        isSuperAdmin: true,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.log(`\n[IMPORTANT] The email ${PRESERVED_EMAIL} was not found in Firebase Authentication.`);
    console.log(`Please sign up/register with ${PRESERVED_EMAIL} on the website first, then re-run this script to clear out all other data.`);
  }
}

async function run() {
  console.log('--- Wiping Database to Clean State ---');
  
  await deleteCollection('commitments');
  await deleteCollection('payments');
  await deleteCollection('notifications');
  await deleteCollection('submittedRequests');
  await deleteCollection('waitingList');
  await deleteCollection('mockEmails');
  await deleteCollection('auditLogs');
  await deleteCollection('deletedRecords');
  
  await cleanUsers();

  console.log('\nDatabase reset to clean state complete!');
}

run().catch(console.error);
