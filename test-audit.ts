import { db } from './src/lib/db'

async function test() {
  const admin = await db.user.findUnique({ where: { id: 'usr_admin' } });
  console.log('usr_admin exists?', !!admin);
}
test().finally(() => process.exit(0))
