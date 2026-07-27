/**
 * Direct Import Script for 201 Savings Commitments
 * 
 * 1. Clears all existing commitments in Firestore
 * 2. Matches each commitment to member user record by name
 * 3. Inserts all 201 commitments into Firestore 'commitments' collection
 * 
 * Run with: npx tsx scripts/import_commitments_direct.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env variables BEFORE importing firebase-admin
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let value = trimmed.substring(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.replace(/\\n/g, '\n');
      }
    }
  });
}

// Dynamically require firebase-admin after process.env is initialized
const { adminDb } = require('../src/lib/firebase-admin');

interface RawCommitment {
  recordId: string;
  memberName: string;
  amount: number;
  collectionMonth: string;
  collectionYear: number;
}

async function runDirectImport() {
  const jsonPath = '/Users/ayodeji/.gemini/antigravity-ide/brain/069dbdc2-ffd5-4abe-9c1a-03df6ad0525f/scratch/parsed_user_commitments_v2.json';
  let rawItems: any[] = [];

  if (fs.existsSync(jsonPath)) {
    rawItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } else {
    const fallbackPath = path.join(process.cwd(), 'parsed_commitments.json');
    rawItems = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  }

  console.log(`Loaded ${rawItems.length} parsed commitments from JSON.`);

  // Step 1: Fetch all users to map names to user IDs
  const usersSnap = await adminDb.collection('users').get();
  const userMapByLowerName = new Map<string, string>();
  usersSnap.forEach((doc: any) => {
    const data = doc.data();
    if (data.name) {
      userMapByLowerName.set(data.name.toLowerCase().trim(), doc.id);
    }
  });

  console.log(`Found ${userMapByLowerName.size} user mappings in Firestore.`);

  // Step 2: Delete existing commitments in Firestore
  const cmtRef = adminDb.collection('commitments');
  const existingSnap = await cmtRef.get();
  console.log(`Deleting ${existingSnap.size} existing commitment records in Firestore...`);

  let batch = adminDb.batch();
  let count = 0;

  for (const doc of existingSnap.docs) {
    batch.delete(doc.ref);
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = adminDb.batch();
    }
  }
  if (count % 400 !== 0) {
    await batch.commit();
  }
  console.log(`✅ Cleared all existing commitments.\n`);

  // Step 3: Insert all 201 commitments into Firestore
  console.log(`Inserting ${rawItems.length} new commitments...`);
  batch = adminDb.batch();
  let inserted = 0;

  for (const item of rawItems) {
    const memberName = item.memberName ? item.memberName.trim() : 'Unknown Member';
    const lowerName = memberName.toLowerCase();
    const matchedUserId = userMapByLowerName.get(lowerName) || item.memberId || `usr_${item.id}`;

    const docId = item.id;
    const docRef = cmtRef.doc(docId);

    let status = 'ACTIVE';
    if (item.collectionYear < 2026) {
      status = 'COMPLETED';
    } else if (item.collectionYear > 2026) {
      status = 'NOT_YET_STARTED';
    } else {
      status = 'ACTIVE';
    }

    const commitmentData = {
      id: item.id,
      memberId: matchedUserId,
      memberName: memberName,
      amount: item.amount,
      goal: `Savings Goal (£${item.amount}/mo)`,
      collectionMonth: item.collectionMonth,
      collectionYear: item.collectionYear,
      endDate: item.endDate || `December ${item.collectionYear}`,
      status,
      createdAt: item.createdAt || '2024-01-26T00:00:00Z',
      updatedAt: new Date().toISOString()
    };

    batch.set(docRef, commitmentData);
    inserted++;

    if (inserted % 400 === 0) {
      await batch.commit();
      batch = adminDb.batch();
    }
  }

  if (inserted % 400 !== 0) {
    await batch.commit();
  }

  console.log(`\n🎉 Successfully imported all ${inserted} savings commitments into Firestore!`);
}

runDirectImport().catch((err) => {
  console.error('Error running direct commitments import:', err);
});
