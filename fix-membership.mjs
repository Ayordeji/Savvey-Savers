import fs from 'fs';
let filePath = 'src/app/api/admin/users/membership-fee/route.ts';
let content = fs.readFileSync(filePath, 'utf8');
content = content
  .replace(/db\.membershipFeeRecord\.findMany\(\(r\) => r\.userId === userId\)/g, "db.membershipFeeRecord.findMany({ where: { userId } })")
  .replace(/db\.membershipFeeRecord\.findMany\(\(r\) => r\.userId === userId && Number\(r\.year\) === parsedYear\)/g, "db.membershipFeeRecord.findMany({ where: { userId, year: parsedYear } })")
  .replace(/db\.membershipFeeRecord\.findMany\(\(r\) => r\.userId === userId && Number\(r\.year\) === Number\(year\)\)/g, "db.membershipFeeRecord.findMany({ where: { userId, year: Number(year) } })")
  .replace(/db\.membershipFeeRecord\.findMany\(\(r\) => r\.userId === userId && r\.status === 'PENDING'\)/g, "db.membershipFeeRecord.findMany({ where: { userId, status: 'PENDING' } })")
  .replace(/await db\.notification\.create\(\{ data: \{/g, "await db.notification.create({ data: {")
  .replace(/isRead: false\s*\}\);/g, "isRead: false } });")
  .replace(/createdAt: new Date\(\)\.toISOString\(\)\s*\}\);/g, "createdAt: new Date().toISOString() } });");
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed membership-fee.');
