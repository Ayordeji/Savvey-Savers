import { db } from '../src/lib/db';

async function main() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  let changes = 0;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    let memberId = u.displayId;
    
    // If no displayId, try to pull it from invitationId if it looks like M-XXXXXX
    if (!memberId) {
      if (u.invitationId && u.invitationId.startsWith('M-')) {
        memberId = u.invitationId;
      } else if (u.id && u.id.startsWith('M-')) {
        memberId = u.id;
      } else {
        // Fallback sequentially based on creation time, like the frontend does
        memberId = `M-${String(i + 1).padStart(6, '0')}`;
      }
      
      console.log(`Setting displayId for ${u.name} (${u.email}) to ${memberId}`);
      await db.user.update({
        where: { id: u.id },
        data: { displayId: memberId }
      });
      changes++;
    }
  }
  
  console.log(`Successfully updated ${changes} users with a displayId.`);
}

main().catch(console.error).finally(() => process.exit(0));
