import fs from 'fs';

function replaceCreateData(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/db\.auditLog\.create\(\{([\s\S]*?action:[\s\S]*?)\}\);/g, "db.auditLog.create({ data: {$1} });")
    .replace(/db\.notification\.create\(\{([\s\S]*?userId:[\s\S]*?)\}\);/g, "db.notification.create({ data: {$1} });")
    .replace(/db\.waitingList\.create\(\{([\s\S]*?name:[\s\S]*?)\}\);/g, "db.waitingList.create({ data: {$1} });")
    .replace(/db\.user\.update\(\{([\s\S]*?id:[\s\S]*?isActive:[\s\S]*?)\}\);/g, "db.user.update({ where: { id: user.id }, data: { isActive: true, passwordHash } });"); // specialized for activate
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed:', filePath);
  }
}

replaceCreateData('src/app/api/admin/waiting-list/route.ts');
replaceCreateData('src/app/api/auth/activate/route.ts');
replaceCreateData('src/app/api/auth/logout/route.ts');
replaceCreateData('src/app/api/waiting-list/route.ts');
