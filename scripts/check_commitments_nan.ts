import { db } from '../src/lib/db';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const c = await db.commitment.findMany();
  const nullAmounts = c.filter(x => typeof x.amount !== 'number' || isNaN(x.amount));
  console.log('Commitments with invalid amounts:', nullAmounts.length);
  if (nullAmounts.length > 0) {
    console.log(nullAmounts.slice(0, 5));
  }
}
main().catch(console.error).finally(() => process.exit(0));
