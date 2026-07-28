import fs from 'fs';
let filePath = 'src/app/api/admin/waiting-list/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content
  .replace(/db\.user\.findFirst\(\(u\) => u\.email\.toLowerCase\(\) === entry\.email\.toLowerCase\(\)\)/g, "db.user.findFirst({ where: { email: entry.email } })")
  .replace(/db\.user\.create\(\{([\s\S]*?name:[\s\S]*?)\}\);/g, "db.user.create({ data: {$1} });")
  .replace(/db\.commitment\.create\(\{([\s\S]*?memberId:[\s\S]*?)\}\);/g, "db.commitment.create({ data: {$1} });");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed waiting list route.');
