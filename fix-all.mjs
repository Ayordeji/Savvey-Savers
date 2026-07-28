import fs from 'fs';

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  for (let [search, replace] of replacements) {
    newContent = newContent.replace(search, replace);
  }
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed:', filePath);
  }
}

replaceInFile('src/app/api/admin/users/route.ts', [
  [/memberEmail: normalizedEmail,/g, ""],
  [/link: approvalLink,/g, ""]
]);

replaceInFile('src/app/api/admin/users/membership-fee/route.ts', [
  [/db\.membershipFeeRecord\.create\(\{([\s\S]*?userId:[\s\S]*?)\}\);/g, "db.membershipFeeRecord.create({ data: {$1} });"]
]);

replaceInFile('src/app/api/auth/activate/route.ts', [
  [/import \{ adminAuth \} from '@\/lib\/firebase-admin';/g, ""],
  [/db\.user\.findMany\(\(u\) => u\.role === 'ADMIN'\)/g, "db.user.findMany({ where: { role: 'ADMIN' } })"],
  [/db\.user\.update\(\{ data: \{([\s\S]*?id:[\s\S]*?)\}\);/g, "db.user.update({ where: { id: user.id }, data: { isActive: true, passwordHash } });"],
  [/db\.notification\.create\(\{ data: \{ data: \{/g, "db.notification.create({ data: {"],
  [/db\.auditLog\.create\(\{ data: \{ data: \{/g, "db.auditLog.create({ data: {"],
  [/} } \}\);/g, "} });"]
]);

replaceInFile('src/app/api/auth/reset-password/route.ts', [
  [/import \{ adminAuth \} from '@\/lib\/firebase-admin';/g, ""]
]);

replaceInFile('src/app/api/waiting-list/route.ts', [
  [/db\.waitingList\.create\(\{ data: \{ data: \{/g, "db.waitingList.create({ data: {"],
  [/db\.notification\.create\(\{ data: \{ data: \{/g, "db.notification.create({ data: {"],
  [/db\.auditLog\.create\(\{ data: \{ data: \{/g, "db.auditLog.create({ data: {"],
  [/} } \}\);/g, "} });"],
  [/db\.user\.findMany\(\(u\) => u\.role === 'ADMIN'\)/g, "db.user.findMany({ where: { role: 'ADMIN' } })"],
  [/db\.user\.findFirst\(\(u\) => u\.email\.toLowerCase\(\) === normalizedEmail\)/g, "db.user.findFirst({ where: { email: normalizedEmail } })"],
  [/db\.waitingList\.findFirst\(\s*\(w\) => w\.email\.toLowerCase\(\) === normalizedEmail\s*\)/g, "db.waitingList.findFirst({ where: { email: normalizedEmail } })"]
]);

replaceInFile('src/app/api/admin/requests/route.ts', [
  [/db\.submittedRequests/g, "db.submittedRequest"],
  [/db\.submittedRequest\.findMany\(\(r\) => r\.commitmentId === commitmentId\)/g, "db.submittedRequest.findMany({ where: { commitmentId } })"],
  [/db\.submittedRequest\.findMany\(\(r\) => r\.userId === userId\)/g, "db.submittedRequest.findMany({ where: { userId } })"],
  [/\.sort\(\(a, b\) => new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)\.getTime\(\)\)/g, ".sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())"],
  [/db\.notification\.create\(\{([\s\S]*?userId:[\s\S]*?)\}\);/g, "db.notification.create({ data: {$1} });"],
  [/db\.auditLog\.create\(\{([\s\S]*?action:[\s\S]*?)\}\);/g, "db.auditLog.create({ data: {$1} });"]
]);

replaceInFile('src/app/api/admin/settings/route.ts', [
  [/for \(const setting of settingsToUpdate\) \{/g, "for (const setting of (settingsToUpdate as any[])) {"],
  [/await db\.setting\.upsert\(\{([\s\S]*?key:[\s\S]*?)\}\);/g, "await db.setting.upsert({ where: { key: setting.key }, update: { value: setting.value }, create: { key: setting.key, value: setting.value } });"],
  [/await db\.auditLog\.create\(\{([\s\S]*?action:[\s\S]*?)\}\);/g, "await db.auditLog.create({ data: {$1} });"]
]);

replaceInFile('src/app/api/admin/upload/route.ts', [
  [/import \{ adminStorage \} from '@\/lib\/firebase-admin';/g, ""]
]);

