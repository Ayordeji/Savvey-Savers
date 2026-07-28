import fs from 'fs';
let filePath = 'src/app/api/admin/users/route.ts';
let content = fs.readFileSync(filePath, 'utf8');
let newContent = content
  .replace(/db\.auditLog\.create\(\{([\s\S]*?action:[\s\S]*?)\}\);/g, "db.auditLog.create({ data: {$1} });")
  .replace(/db\.notification\.create\(\{([\s\S]*?userId:[\s\S]*?)\}\);/g, "db.notification.create({ data: {$1} });");

if (content !== newContent) {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Fixed:', filePath);
}
