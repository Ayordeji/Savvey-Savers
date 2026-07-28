import fs from 'fs';
import path from 'path';

const files = [
  'src/app/api/admin/commitments/action/route.ts',
  'src/app/api/admin/commitments/route.ts',
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Fix notification.create, auditLog.create that lack { data: } wrapper
  // Pattern: await db.MODEL.create({\n  field: value (but NOT "data: {")
  // We need to wrap with { data: { ... } }
  
  // Match db.notification.create({ without data:
  code = code.replace(
    /await db\.notification\.create\(\{\s*\n(\s+)(userId|message|type|isRead)/g,
    (match, indent, firstField) => {
      return `await db.notification.create({ data: {\n${indent}${firstField}`;
    }
  );
  
  // Match db.auditLog.create({ without data:
  code = code.replace(
    /await db\.auditLog\.create\(\{\s*\n(\s+)(action|userId|details)/g,
    (match, indent, firstField) => {
      return `await db.auditLog.create({ data: {\n${indent}${firstField}`;
    }
  );

  // Fix closing brackets - find patterns that have extra nested }
  // This is complex, let's just manually add } }) where needed by checking

  fs.writeFileSync(file, code, 'utf8');
}

console.log('Done');
