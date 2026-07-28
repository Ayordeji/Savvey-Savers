import { db } from './src/lib/db';
async function main() {
  const savingGoals = [
    { goal: "Debt Repayment", enabled: true },
    { goal: "Dream Holiday", enabled: true },
    { goal: "Investment", enabled: true },
    { goal: "My First Home", enabled: true },
    { goal: "Property Purchase", enabled: true },
    { goal: "Savings", enabled: true },
    { goal: "School Fees", enabled: true },
    { goal: "Wedding", enabled: true },
    { goal: "Other", enabled: true }
  ];
  const commitmentAmounts = [
    { amount: "100.00", enabled: true },
    { amount: "250.00", enabled: true },
    { amount: "300.00", enabled: true },
    { amount: "500.00", enabled: true },
    { amount: "750.00", enabled: true },
    { amount: "1000.00", enabled: true },
    { amount: "1250.00", enabled: true },
    { amount: "1500.00", enabled: true }
  ];

  await db.setting.upsert({
    where: { key: 'savingGoals' },
    update: { value: savingGoals },
    create: { key: 'savingGoals', value: savingGoals }
  });

  await db.setting.upsert({
    where: { key: 'commitmentAmounts' },
    update: { value: commitmentAmounts },
    create: { key: 'commitmentAmounts', value: commitmentAmounts }
  });
  console.log("Seeded settings.");
}
main().catch(console.error).finally(() => process.exit(0));
