/**
 * Direct Import Script for 201 Savings Commitments
 * 
 * 1. Clears all existing commitments in Firestore
 * 2. Matches each commitment to member user record by name
 * 3. Inserts all 201 commitments into Firestore 'commitments' collection
 * 
 * Run with: npx tsx scripts/import_commitments_direct.ts
 */

import { adminDb } from '../src/lib/firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

interface RawCommitment {
  recordId: string;
  memberName: string;
  amount: number;
  collectionMonth: string;
  collectionYear: number;
}

async function runDirectImport() {
  const jsonPath = '/Users/ayodeji/.gemini/antigravity-ide/brain/069dbdc2-ffd5-4abe-9c1a-03df6ad0525f/scratch/parsed_commitments.json';
  let rawItems: RawCommitment[] = [];

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
  usersSnap.forEach((doc) => {
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
    const matchedUserId = userMapByLowerName.get(lowerName) || `usr_${item.recordId}`;

    const docId = item.recordId;
    const docRef = cmtRef.doc(docId);

    const commitmentData = {
      id: item.recordId,
      memberId: matchedUserId,
      memberName: memberName,
      amount: item.amount,
      goal: `Savings Goal (£${item.amount}/mo)`,
      collectionMonth: item.collectionMonth,
      collectionYear: item.collectionYear,
      status: item.collectionYear < 2026 ? 'COMPLETED' : 'ACTIVE',
      createdAt: item.collectionYear < 2026 ? `${item.collectionYear}-01-01T00:00:00Z` : '2026-01-01T00:00:00Z',
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
