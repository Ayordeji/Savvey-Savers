import fs from 'fs';
let filePath = 'src/app/api/admin/users/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content
  .replace(/db\.user\.create\(\{([\s\S]*?name:[\s\S]*?)\}\);/g, "db.user.create({ data: {$1} });")
  .replace(/db\.commitment\.create\(\{([\s\S]*?memberId:[\s\S]*?)\}\);/g, "db.commitment.create({ data: {$1} });")
  .replace(/db\.notification\.create\(\{([\s\S]*?userId:[\s\S]*?)\}\);/g, "db.notification.create({ data: {$1} });")
  .replace(/targetUserId: user\.id/g, "")
  .replace(/db\.auditLog\.create\(\{([\s\S]*?action:[\s\S]*?)\}\);/g, "db.auditLog.create({ data: {$1} });");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed users route.');
