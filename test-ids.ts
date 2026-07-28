import { db } from './src/lib/db'

async function test() {
  const users = await db.user.findMany({
    select: { id: true, invitationId: true }
  });
  console.log(users.map(u => u.invitationId).filter(Boolean));
}
test().finally(() => process.exit(0))
