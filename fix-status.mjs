import fs from 'fs';
let filePath = 'src/app/api/admin/commitments/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/status = 'NOT_YET_STARTED';/g, "status = 'PENDING';");

fs.writeFileSync(filePath, content, 'utf8');

let reportPath = 'src/app/dashboard/reports/commitments/page.tsx';
let reportContent = fs.readFileSync(reportPath, 'utf8');

reportContent = reportContent
  .replace(/\{cmt\.status === 'NOT_YET_STARTED' \? 'Pending' : cmt\.status\}/g, "{cmt.status === 'PENDING' ? 'Pending' : cmt.status.charAt(0).toUpperCase() + cmt.status.slice(1).toLowerCase()}")
  .replace(/\{selectedCmt\.status === 'NOT_YET_STARTED' \? 'Pending' : selectedCmt\.status\}/g, "{selectedCmt.status === 'PENDING' ? 'Pending' : selectedCmt.status.charAt(0).toUpperCase() + selectedCmt.status.slice(1).toLowerCase()}");

fs.writeFileSync(reportPath, reportContent, 'utf8');

console.log('Fixed status.');
