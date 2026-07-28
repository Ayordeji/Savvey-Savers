import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const commitments = await db.commitment.findMany({ orderBy: { createdAt: 'asc' } });

  console.log('Total commitments:', commitments.length);

  // Separate already-have-displayId vs need one
  const withDisplayId = commitments.filter((c: any) => c.displayId && c.displayId.startsWith('SC-'));
  const withoutDisplayId = commitments.filter((c: any) => !c.displayId || !c.displayId.startsWith('SC-'));

  console.log('Already have SC- displayId:', withDisplayId.length);
  console.log('Need displayId:', withoutDisplayId.length);

  // Find the max existing SC number
  let maxNum = 0;
  for (const c of withDisplayId as any[]) {
    const n = parseInt(c.displayId.replace(/^SC-0*/, '') || '0', 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
  console.log('Max existing SC number:', maxNum);

  // Also check if any commitment has an SC-style ID in its `id` field (old migration format)
  // and hasn't been given a displayId yet
  let fixed = 0;
  for (const c of withoutDisplayId as any[]) {
    let displayId: string;

    // Check if the raw `id` looks like SC-XXXXX
    if (c.id.startsWith('SC-') || c.id.startsWith('sc-')) {
      displayId = c.id.toUpperCase();
    } else if (c.id.startsWith('SCC-')) {
      displayId = c.id.replace('SCC-', 'SC-');
    } else {
      // Raw UUID — assign next sequential SC number
      maxNum++;
      displayId = `SC-${String(maxNum).padStart(5, '0')}`;
    }

    try {
      await db.commitment.update({ where: { id: c.id }, data: { displayId } });
      console.log(`Set displayId=${displayId} on commitment ${c.id} (${c.memberName || c.memberId}, ${c.goal})`);
      fixed++;
    } catch (e: any) {
      console.error(`Failed to set displayId=${displayId} on ${c.id}:`, e.message);
    }
  }

  console.log(`\nDone. Fixed ${fixed} commitments.`);
}

main().catch(console.error).finally(() => pool.end());
