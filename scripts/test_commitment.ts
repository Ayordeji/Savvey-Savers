import { db } from '../src/lib/db';

async function main() {
  try {
    const targetMemberId = "f2ce0250-bab8-420c-9f9f-d5a16da18135"; // from earlier prompt
    const amount = "100";
    const goal = "Test";
    const startMonth = "January";
    const startYear = 2026;
    const requestCollection = false;
    const status = "ACTIVE";

    const member = await db.user.findUnique({ where: { id: targetMemberId } });
    if (!member) {
      console.log("Member not found");
      return;
    }
    console.log("Found member", member.id, member.name);

    const existingCommitments = await db.commitment.findMany({
      where: { displayId: { startsWith: 'SC-' } },
      select: { displayId: true }
    });
    let maxScNum = 0;
    for (const ec of existingCommitments) {
      if (ec.displayId) {
        const num = parseInt(ec.displayId.replace(/^SC-0*/, ''), 10);
        if (!isNaN(num) && num > maxScNum) maxScNum = num;
      }
    }
    const nextScId = `SC-${String(maxScNum + 1).padStart(5, '0')}`;
    console.log("next id", nextScId);

    const newCommitment = await db.commitment.create({ data: {
      displayId: nextScId,
      memberId: targetMemberId,
      amount: parseFloat(amount),
      goal,
      collectionMonth: startMonth,
      collectionYear: startYear,
      endDate: new Date(startYear, 11, 31),
      status,
      memberName: member.name || ''
    } });
    console.log("Created commitment", newCommitment.id);

    // Create related payments placeholder for the collection month
    await db.payment.create({ data: {
      commitmentId: newCommitment.id,
      userId: targetMemberId,
      amount: newCommitment.amount,
      month: startMonth,
      year: startYear,
      status: 'PENDING'
    } });
    console.log("Created payment");
  } catch (e) {
    console.error(e);
  } finally {
    await db.$disconnect();
  }
}

main();
