import { db } from './src/lib/db'

async function test() {
  const user = await db.user.findFirst();
  if (!user) return console.log('no user');
  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        name: 'Test',
        firstName: 'Test',
        lastName: 'Test',
        email: user.email,
        phone: '123456789',
        membership: user.membership,
        role: user.role,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        postCode: user.postCode,
        country: user.country,
        permissions: user.permissions
      }
    });
    console.log('Success!');
  } catch (err) {
    console.error('Failed!', err);
  }
}
test().finally(() => process.exit(0))
