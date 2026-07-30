import { db } from "./src/lib/db";
async function main() {
  try {
    const records = await db.user.count();
    console.log("Total users:", records);
  } catch (err) {
    console.error(err);
  } finally {
    await db.$disconnect();
  }
}
main();
