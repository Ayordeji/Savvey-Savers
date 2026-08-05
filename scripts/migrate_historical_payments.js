const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

const payments2025 = [
  { month: 'January', year: 2025, date: '2025-02-01T00:00:00Z' },
  { month: 'February', year: 2025, date: '2025-02-28T00:00:00Z' },
  { month: 'March', year: 2025, date: '2025-03-31T00:00:00Z' },
  { month: 'April', year: 2025, date: '2025-04-30T00:00:00Z' },
  { month: 'May', year: 2025, date: '2025-05-31T00:00:00Z' },
  { month: 'June', year: 2025, date: '2025-06-30T00:00:00Z' },
  { month: 'July', year: 2025, date: '2025-07-31T00:00:00Z' },
  { month: 'August', year: 2025, date: '2025-08-30T00:00:00Z' },
  { month: 'September', year: 2025, date: '2025-10-01T00:00:00Z' },
  { month: 'October', year: 2025, date: '2025-10-31T00:00:00Z' },
  { month: 'November', year: 2025, date: '2025-12-01T00:00:00Z' },
  { month: 'December', year: 2025, date: '2025-12-31T00:00:00Z' }
];

const payments2026 = [
  { month: 'January', year: 2026, date: '2026-02-09T00:00:00Z' },
  { month: 'February', year: 2026, date: '2026-03-03T00:00:00Z' }
];

async function main() {
  console.log('Starting historical payment migration...');

  const commitments2025 = await db.commitment.findMany({
    where: { collectionYear: 2025 }
  });

  const commitments2026 = await db.commitment.findMany({
    where: { collectionYear: 2026 }
  });

  console.log(`Found ${commitments2025.length} commitments for 2025.`);
  console.log(`Found ${commitments2026.length} commitments for 2026.`);

  // 1. Delete existing placeholder payments for these years
  console.log('Clearing existing payments for 2025 & 2026 commitments to prevent duplicates...');
  const ids2025 = commitments2025.map(c => c.id);
  const ids2026 = commitments2026.map(c => c.id);
  const allIds = [...ids2025, ...ids2026];

  if (allIds.length > 0) {
    await db.payment.deleteMany({
      where: { commitmentId: { in: allIds } }
    });
  }

  // 2. Generate new payments
  const newPayments = [];
  
  // For 2025
  for (const cmt of commitments2025) {
    for (const p of payments2025) {
      newPayments.push({
        commitmentId: cmt.id,
        userId: cmt.memberId,
        amount: cmt.amount,
        month: p.month,
        year: p.year,
        status: 'CONFIRMED',
        confirmedAt: new Date(p.date),
        createdAt: new Date(p.date),
      });
    }
  }

  // For 2026
  for (const cmt of commitments2026) {
    for (const p of payments2026) {
      newPayments.push({
        commitmentId: cmt.id,
        userId: cmt.memberId,
        amount: cmt.amount,
        month: p.month,
        year: p.year,
        status: 'CONFIRMED',
        confirmedAt: new Date(p.date),
        createdAt: new Date(p.date),
      });
    }
  }

  // 3. Insert in batches
  console.log(`Inserting ${newPayments.length} new historical payments...`);
  
  // Prisma createMany is the best way here
  if (newPayments.length > 0) {
    await db.payment.createMany({
      data: newPayments
    });
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
