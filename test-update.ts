import { db } from './src/lib/db'

async function test() {
  const user = await db.user.findFirst();
  if (!user) return console.log('no user');
  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        invitationId: null,
        invitationExpiresAt: null,
        firstName: 'Test',
        lastName: 'Test',
        name: 'Test Test',
        passwordHash: 'hash',
        phone: '123',
        addressLine1: 'addr1',
        addressLine2: 'addr2',
        city: 'city',
        postCode: 'code',
        country: 'UNITED KINGDOM',
        termsAccepted: true,
        securityQuestions: [],
      }
    });
    console.log('Success!');
  } catch (err) {
    console.error('Failed!', err);
  }
}
test().finally(() => process.exit(0))
