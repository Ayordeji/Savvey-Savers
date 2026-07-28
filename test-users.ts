import { db } from './src/lib/db';
async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true, name: true } });
  console.log(users.find(u => u.id === 'usr_admin') ? 'usr_admin exists' : 'usr_admin DOES NOT EXIST');
}
main().catch(console.error).finally(() => process.exit(0));
