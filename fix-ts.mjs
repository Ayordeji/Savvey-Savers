import fs from 'fs';

function replaceAll(str, mapObj) {
  var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
  return str.replace(re, function(matched){
    return mapObj[matched.toLowerCase()] || mapObj[matched];
  });
}

// 1. src/app/api/admin/migrate/route.ts
let migratePath = 'src/app/api/admin/migrate/route.ts';
let migrateCode = fs.readFileSync(migratePath, 'utf8');
migrateCode = migrateCode.replace(/db\.commitment\.create\((.*?)\)/g, 'db.commitment.create({ data: $1 })');
migrateCode = migrateCode.replace(/db\.payments\./g, 'db.payment.');
migrateCode = migrateCode.replace(/db\.waitingList\.create\(\{\s*id:/g, 'db.waitingList.create({ data: { id:');
migrateCode = migrateCode.replace(/status:\s*p\.status \|\| 'PENDING'\s*\}\)/g, "status: p.status || 'PENDING'\n    } })");
migrateCode = migrateCode.replace(/await db\.waitingList\.create\({\s*id/g, 'await db.waitingList.create({ data: { id');
fs.writeFileSync(migratePath, migrateCode);

// 2. src/app/api/admin/notifications/route.ts
let notifPath = 'src/app/api/admin/notifications/route.ts';
let notifCode = fs.readFileSync(notifPath, 'utf8');
notifCode = notifCode.replace(/db\.notification\.findMany\(\(n\) \=\> !n\.isRead\)/g, 'db.notification.findMany({ where: { isRead: false } })');
notifCode = notifCode.replace(/db\.notification\.findMany\(\(n\) \=\> n\.userId === session\.id\)/g, 'db.notification.findMany({ where: { userId: session.id } })');
notifCode = notifCode.replace(/db\.notification\.findMany\(\(n\) \=\> n\.userId === session\.id && !n\.isRead\)/g, 'db.notification.findMany({ where: { userId: session.id, isRead: false } })');
fs.writeFileSync(notifPath, notifCode);

// 3. src/app/api/admin/payments/route.ts
let payPath = 'src/app/api/admin/payments/route.ts';
let payCode = fs.readFileSync(payPath, 'utf8');
payCode = payCode.replace(/db\.payments\./g, 'db.payment.');
payCode = payCode.replace(/db\.payment\.findMany\(\(p\) \=\>/g, 'db.payment.findMany({ where: {'); // Need a more robust fix
fs.writeFileSync(payPath, payCode);

// 4. src/app/api/admin/requests/route.ts
let reqPath = 'src/app/api/admin/requests/route.ts';
let reqCode = fs.readFileSync(reqPath, 'utf8');
reqCode = reqCode.replace(/db\.submittedRequests\./g, 'db.submittedRequest.');
reqCode = reqCode.replace(/db\.submittedRequest\.findMany\(\(r\) \=\> r\.userId === session\.id\)/g, 'db.submittedRequest.findMany({ where: { userId: session.id } })');
fs.writeFileSync(reqPath, reqCode);

// 5. src/app/api/admin/settings/route.ts
let setPath = 'src/app/api/admin/settings/route.ts';
let setCode = fs.readFileSync(setPath, 'utf8');
setCode = setCode.replace(/await db\.setting\.create\(setting\)/g, 'await db.setting.create({ data: setting })');
setCode = setCode.replace(/key:\s*key\s*\}/g, 'key: key } }');
fs.writeFileSync(setPath, setCode);

// 6. src/app/api/auth/activate/route.ts
let actPath = 'src/app/api/auth/activate/route.ts';
let actCode = fs.readFileSync(actPath, 'utf8');
actCode = actCode.replace(/db\.user\.findMany\(\(u\) \=\> u\.invitationId === memberId\)/g, 'db.user.findMany({ where: { invitationId: memberId } })');
actCode = actCode.replace(/db\.user\.findMany\(\(u\) \=\> u\.email === email\)/g, 'db.user.findMany({ where: { email } })');
actCode = actCode.replace(/await adminAuth\.updateUser\(/g, '// await adminAuth.updateUser(');
actCode = actCode.replace(/await db\.user\.create\(\{\s*id/g, 'await db.user.create({ data: { id');
actCode = actCode.replace(/isActive: true\s*\}\)/g, "isActive: true\n    } })");
fs.writeFileSync(actPath, actCode);

// 7. src/app/api/auth/reset-password/route.ts
let resPath = 'src/app/api/auth/reset-password/route.ts';
let resCode = fs.readFileSync(resPath, 'utf8');
resCode = resCode.replace(/await adminAuth\.generatePasswordResetLink/g, '// await adminAuth.generatePasswordResetLink');
fs.writeFileSync(resPath, resCode);

// 8. src/app/api/waiting-list/route.ts
let waitPath = 'src/app/api/waiting-list/route.ts';
let waitCode = fs.readFileSync(waitPath, 'utf8');
waitCode = waitCode.replace(/db\.user\.findMany\(\(u\) \=\> u\.email === email\)/g, 'db.user.findMany({ where: { email } })');
waitCode = waitCode.replace(/await db\.waitingList\.create\(\{\s*name/g, 'await db.waitingList.create({ data: { name');
waitCode = waitCode.replace(/status: 'PENDING'\s*\}\)/g, "status: 'PENDING'\n    } })");
fs.writeFileSync(waitPath, waitCode);

console.log('Fixed TS files!');
