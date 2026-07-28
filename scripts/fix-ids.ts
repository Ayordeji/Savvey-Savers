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
  const users = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
  const withoutDisplayId = users.filter((u: any) => !u.displayId || !u.displayId.startsWith('M-'));
  console.log('Users missing displayId:', withoutDisplayId.length);

  const withDisplayId = users.filter((u: any) => u.displayId && u.displayId.startsWith('M-'));
  let maxNum = 0;
  for (const u of withDisplayId as any[]) {
    const n = parseInt(u.displayId.substring(2), 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }

  for (const u of withoutDisplayId as any[]) {
    maxNum++;
    const displayId = 'M-' + String(maxNum).padStart(6, '0');
    await db.user.update({ where: { id: u.id }, data: { displayId } });
    console.log('Assigned', displayId, 'to', u.name, u.email);
  }

  console.log('Done. Fixed', withoutDisplayId.length, 'users.');
}

main().catch(console.error).finally(() => pool.end());
