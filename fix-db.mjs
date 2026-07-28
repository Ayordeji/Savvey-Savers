import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/db\.users/g, 'db.user')
      .replace(/db\.commitments/g, 'db.commitment')
      .replace(/db\.notifications/g, 'db.notification')
      .replace(/db\.auditLogs/g, 'db.auditLog')
      .replace(/db\.settings/g, 'db.setting')
      .replace(/db\.deletedRecords/g, 'db.deletedRecord');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
