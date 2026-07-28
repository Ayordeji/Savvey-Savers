import { db } from '../src/lib/db';

async function main() {
  const users = await db.user.findMany({
    select: { id: true, invitationId: true, name: true }
  });
  
  let maxId = 0;
  for (const u of users) {
    if (u.invitationId && u.invitationId.startsWith('M-')) {
      const num = parseInt(u.invitationId.substring(2), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    }
  }
  console.log('Max ID currently found:', maxId);
  console.log('Sample users with invitationId:', users.filter(u => u.invitationId).slice(0, 5));
  console.log('Sample users without invitationId:', users.filter(u => !u.invitationId).slice(0, 5));
}

main().catch(console.error).finally(() => process.exit(0));
