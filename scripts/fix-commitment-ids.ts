import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const pool = new Pool({ connectionString, connectionTimeoutMillis: 10000 });

async function main() {
  const client = await pool.connect();
  try {
    // Get all commitments ordered by createdAt
    const { rows: all } = await client.query(
      'SELECT id, "displayId", "memberName", goal, "createdAt" FROM "Commitment" ORDER BY "createdAt" ASC'
    );

    console.log('Total commitments:', all.length);

    // Find max existing SC- number
    let maxNum = 0;
    for (const row of all) {
      if (row.displayId && /^SC-\d+$/.test(row.displayId)) {
        const n = parseInt(row.displayId.replace(/^SC-0*/, '') || '0', 10);
        if (n > maxNum) maxNum = n;
      }
    }
    console.log('Max existing SC number:', maxNum);

    // Fix all commitments without a valid SC- displayId
    let fixed = 0;
    for (const row of all) {
      if (row.displayId && /^SC-\d+$/.test(row.displayId)) continue; // already good

      let displayId: string;
      if (row.id.startsWith('SC-') || row.id.startsWith('sc-')) {
        displayId = row.id.toUpperCase();
      } else {
        maxNum++;
        displayId = `SC-${String(maxNum).padStart(5, '0')}`;
      }

      await client.query(
        'UPDATE "Commitment" SET "displayId" = $1 WHERE id = $2',
        [displayId, row.id]
      );
      console.log(`Set displayId=${displayId} → ${row.memberName || row.id} (${row.goal})`);
      fixed++;
    }

    console.log(`\nDone. Fixed ${fixed} commitments.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
