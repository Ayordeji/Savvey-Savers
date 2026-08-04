import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const p = await db.payment.findFirst();
  console.log("Sample month:", `'${p?.month}'`);
}
main().finally(() => db.$disconnect());
