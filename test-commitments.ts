import { db } from './src/lib/db';
async function main() {
  const cmts = await db.commitment.findMany({ take: 3 });
  console.log(cmts);
}
main().catch(console.error).finally(() => process.exit(0));
