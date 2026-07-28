import { db } from './src/lib/db';
async function main() {
  const users = await db.user.findMany({ take: 1 });
  const userId = users[0].id;
  try {
    const record = await db.membershipFeeRecord.create({ data: {
      userId,
      year: 2028,
      baseFee: 200,
      adminFee: 30,
      totalFee: 230,
      status: 'PENDING',
      requestedAt: new Date()
    } });
    console.log("Success", record);
  } catch (err) {
    console.error("Failed to create", err);
  }
}
main().catch(console.error).finally(() => process.exit(0));
