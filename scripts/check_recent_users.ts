import { db } from '../src/lib/db';

async function main() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, name: true, email: true, role: true, invitedBy: true, createdAt: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e));
