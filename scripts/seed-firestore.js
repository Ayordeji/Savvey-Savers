const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse .env manually
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const projectId = env['FIREBASE_PROJECT_ID'] || env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const clientEmail = env['FIREBASE_CLIENT_EMAIL'];
let privateKey = env['FIREBASE_PRIVATE_KEY'];

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase credentials in .env. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  })
});

const auth = admin.auth();
const db = admin.firestore();
const DATA_DIR = path.join(__dirname, '../data');

async function seedCollection(collectionName, filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`No file found for ${collectionName} at ${filePath}, skipping.`);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Seeding ${data.length} records into Firestore collection '${collectionName}'...`);
  
  const batch = db.batch();
  for (const item of data) {
    // Determine doc ID: id or key
    const docId = item.id || item.key;
    if (!docId) {
      console.warn(`Record in ${filename} missing id/key:`, item);
      continue;
    }
    
    // Clean undefined fields to avoid Firestore errors
    const cleanedItem = { ...item };
    for (const key of Object.keys(cleanedItem)) {
      if (cleanedItem[key] === undefined) {
        cleanedItem[key] = null;
      }
    }
    
    const docRef = db.collection(collectionName).doc(docId);
    batch.set(docRef, cleanedItem);
  }
  
  await batch.commit();
  console.log(`Collection '${collectionName}' seeded successfully.`);
}

async function seedUsers() {
  const filePath = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(filePath)) {
    console.log(`No users.json file found, skipping user creation.`);
    return;
  }
  
  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Seeding ${users.length} users into Firebase Auth & Firestore...`);
  
  for (const user of users) {
    // 1. Create or verify user in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await auth.getUser(user.id);
      console.log(`User ${user.email} already exists in Firebase Auth with UID: ${user.id}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        try {
          firebaseUser = await auth.createUser({
            uid: user.id,
            email: user.email,
            password: 'password123', // set default password for seeded accounts
            displayName: user.name,
            phoneNumber: user.phone || undefined,
          });
          console.log(`Created user ${user.email} in Firebase Auth with UID: ${user.id}`);
        } catch (createErr) {
          console.error(`Failed to create user ${user.email} in Firebase Auth:`, createErr.message);
        }
      } else {
        console.error(`Error checking user ${user.email} in Firebase Auth:`, err.message);
      }
    }
    
    // 2. Save user record in Firestore
    const cleanedUser = { ...user };
    delete cleanedUser.passwordHash; // Don't save bcrypt password hash to Firestore
    
    // Convert undefined to null
    for (const key of Object.keys(cleanedUser)) {
      if (cleanedUser[key] === undefined) {
        cleanedUser[key] = null;
      }
    }
    
    await db.collection('users').doc(user.id).set(cleanedUser);
    console.log(`User ${user.email} saved to Firestore.`);
  }
}

async function main() {
  try {
    console.log('Starting Firebase Seeding...');
    
    // Seed users first (creates them in Firebase Auth & Firestore)
    await seedUsers();
    
    // Seed remaining Firestore collections
    await seedCollection('commitments', 'commitments.json');
    await seedCollection('payments', 'payments.json');
    await seedCollection('notifications', 'notifications.json');
    await seedCollection('submittedRequests', 'submittedRequests.json');
    await seedCollection('waitingList', 'waitingList.json');
    await seedCollection('settings', 'settings.json');
    await seedCollection('mockEmails', 'mockEmails.json');
    await seedCollection('auditLogs', 'auditLogs.json');
    await seedCollection('deletedRecords', 'deletedRecords.json');
    
    console.log('Firebase Seeding completed successfully!');
  } catch (err) {
    console.error('Error during Firebase Seeding:', err);
  }
}

main();
