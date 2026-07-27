const fs = require('fs');

const dbPath = 'src/lib/db.ts';
let dbContent = fs.readFileSync(dbPath, 'utf8');

const fixScriptPath = 'scripts/fix_import_users.ts';
const fixScriptContent = fs.readFileSync(fixScriptPath, 'utf8');

// Extract members array from fix script
const membersMatch = fixScriptContent.match(/const members = (\[[\s\S]*?\]);/);
if (membersMatch) {
  const membersData = eval(membersMatch[1]);
  
  // Format them for the db.ts users array
  const formattedUsers = membersData.map(m => {
    return {
      id: `usr_${m.invitationId}`,
      name: m.name,
      firstName: m.name.split(' ')[0] || '',
      lastName: m.name.split(' ').slice(1).join(' ') || '',
      email: m.email,
      phone: m.phone,
      role: m.role,
      isSuperAdmin: false,
      isActive: m.isActive,
      membershipFeeConfirmed: true,
      createdAt: m.createdAt,
      invitationId: m.invitationId,
      permissions: []
    };
  });

  // Create string representation
  const usersStr = JSON.stringify(formattedUsers, null, 2);

  // Replace the users array in db.ts
  dbContent = dbContent.replace(
    /users:\s*\[[\s\S]*?\],\n\s*commitments:/,
    `users: [\n    {\n      id: '3MMvFU6ucAXqmPhalkQOoMsbMMu1',\n      name: 'Praise',\n      firstName: 'Praise',\n      lastName: '',\n      email: 'praisetechy001@gmail.com',\n      phone: '+447000000000',\n      role: 'ADMIN',\n      isSuperAdmin: true,\n      isActive: true,\n      membershipFeeConfirmed: true,\n      createdAt: '2026-07-26T23:35:08.348Z',\n      invitationId: 'M-000001',\n      permissions: [\n        'DELETE_USER',\n        'EDIT_USER',\n        'VIEW_USER',\n        'MANAGE_COMMITMENTS',\n        'MANAGE_PAYMENTS',\n        'MANAGE_SETTINGS',\n        'VIEW_AUDIT_LOGS',\n        'SEND_NOTIFICATIONS',\n      ]\n    },\n    {\n      id: 'usr_admin',\n      name: 'Savvey Admin',\n      firstName: 'Savvey',\n      lastName: 'Admin',\n      email: 'admin@savveysavers.com',\n      phone: '+447123456789',\n      role: 'ADMIN',\n      isSuperAdmin: false,\n      isActive: true,\n      membershipFeeConfirmed: true,\n      createdAt: '2026-07-20T10:00:00.000Z',\n      invitationId: 'M-000002',\n      permissions: [\n        'DELETE_USER',\n        'EDIT_USER',\n        'VIEW_USER',\n        'MANAGE_COMMITMENTS',\n        'MANAGE_PAYMENTS',\n        'MANAGE_SETTINGS',\n        'VIEW_AUDIT_LOGS',\n        'SEND_NOTIFICATIONS',\n      ]\n    },\n${usersStr.substring(1, usersStr.length - 1)}],\n  commitments:`
  );

  fs.writeFileSync(dbPath, dbContent);
  console.log("Injected " + formattedUsers.length + " users into db.ts successfully.");
} else {
  console.error("Could not find members array in fix_import_users.ts");
}
