import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const commits = await prisma.commitment.findMany({ take: 5 });
  console.log(commits);
}
main().finally(() => prisma.$disconnect());
