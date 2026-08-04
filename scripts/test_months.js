const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const p = await db.payment.findFirst();
  console.log("Sample month:", `'${p?.month}'`);
  const c = await db.commitment.findFirst();
  console.log("Sample collectionMonth:", `'${c?.collectionMonth}'`);
}
main().finally(() => db.$disconnect());
