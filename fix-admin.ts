import { db } from './src/lib/db'

async function fix() {
  const admin = await db.user.findUnique({ where: { id: 'usr_admin' } });
  if (!admin) {
    await db.user.create({
      data: {
        id: 'usr_admin',
        name: 'System Admin',
        firstName: 'System',
        lastName: 'Admin',
        email: 'savveysaverscollective@gmail.com',
        phone: '+447000000000',
        role: 'ADMIN',
        isSuperAdmin: true,
        isActive: true,
        termsAccepted: true
      }
    });
    console.log('Created usr_admin');
  } else {
    console.log('usr_admin already exists');
  }
}
fix().finally(() => process.exit(0))
