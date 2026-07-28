import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  for (let [search, replace] of replacements) {
    newContent = newContent.replace(search, replace);
  }
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed Prisma syntax in:', filePath);
  }
}

// fix db.user.findMany((u) => u.role === 'ADMIN') to db.user.findMany({ where: { role: 'ADMIN' } })
// fix db.user.findFirst((u) => u.email.toLowerCase() === normalizedEmail) etc.

replaceInFile('src/app/api/admin/users/route.ts', [
  [/db\.user\.findFirst\(\(u\) => u\.email\.toLowerCase\(\) === normalizedEmail\)/g, "db.user.findFirst({ where: { email: normalizedEmail } })"],
  [/db\.user\.findMany\(\(u\) => u\.role === 'ADMIN'\)/g, "db.user.findMany({ where: { role: 'ADMIN' } })"],
  [/db\.commitment\.findMany\(\(c: any\) => c\.memberId === id\)/g, "db.commitment.findMany({ where: { memberId: id } })"],
  [/db\.commitment\.findMany\(\(c\) => c\.memberId === id\)/g, "db.commitment.findMany({ where: { memberId: id } })"],
]);

replaceInFile('src/app/api/auth/activate/route.ts', [
  [/db\.user\.findMany\(\(u\) => u\.role === 'ADMIN'\)/g, "db.user.findMany({ where: { role: 'ADMIN' } })"],
  [/db\.user\.findFirst\(\(u\) => u\.email\.toLowerCase\(\) === normalizedEmail\)/g, "db.user.findFirst({ where: { email: normalizedEmail } })"]
]);

replaceInFile('src/app/api/auth/reset-password/route.ts', [
  [/db\.user\.findFirst\(\(u\) => u\.email\.toLowerCase\(\) === normalizedEmail\)/g, "db.user.findFirst({ where: { email: normalizedEmail } })"]
]);

replaceInFile('src/app/api/waiting-list/route.ts', [
  [/db\.waitingList\.findFirst\(\(w\) => w\.email\.toLowerCase\(\) === email\.toLowerCase\(\)\)/g, "db.waitingList.findFirst({ where: { email } })"],
  [/db\.user\.findFirst\(\(u\) => u\.email\.toLowerCase\(\) === email\.toLowerCase\(\)\)/g, "db.user.findFirst({ where: { email } })"],
  [/db\.user\.findMany\(\(u\) => u\.role === 'ADMIN'\)/g, "db.user.findMany({ where: { role: 'ADMIN' } })"]
]);

replaceInFile('src/app/dashboard/layout.tsx', [
  [/db\.notification\.findMany\(\(n\) => n\.userId === user\.id\)/g, "db.notification.findMany({ where: { userId: user.id } })"]
]);

replaceInFile('src/lib/email.ts', [
  [/db\.mockEmails/g, "db.mockEmail"]
]);

