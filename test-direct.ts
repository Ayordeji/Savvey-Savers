import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});
async function main() {
  try {
    const c = await prisma.user.count();
    console.log("Success with Direct URL! Count:", c);
  } catch(e) {
    console.error("Direct URL failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
