const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../src/lib/db.ts');
let dbContent = fs.readFileSync(dbPath, 'utf8');

// We will parse the CSVs.
const memberCsv = fs.readFileSync(path.join(__dirname, '../public/member_list.csv'), 'utf8');
const commitCsv = fs.readFileSync(path.join(__dirname, '../public/exported_data.csv'), 'utf8');

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && line[j+1] === '"') {
        current += '"';
        j++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    results.push(obj);
  }
  return results;
}

const usersData = parseCSV(memberCsv);
const commitsData = parseCSV(commitCsv);

const usersArray = [];
const commitsArray = [];
const paymentsArray = [];

let adminId = '';

usersData.forEach((u) => {
  const id = u['Invitation ID'] || `M-${Math.floor(Math.random()*10000)}`;
  const role = u['Name'] && u['Name'].toLowerCase().includes('admin') ? 'ADMIN' : 'MEMBER';
  if (role === 'ADMIN' && !adminId) adminId = `usr_${id}`;
  
  // Format dates properly
  let createdStr = new Date().toISOString();
  if (u['Created ON']) {
    const parts = u['Created ON'].split(' ')[0].split('/');
    if (parts.length === 3) createdStr = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString();
  }

  usersArray.push({
    id: `usr_${id}`,
    name: u['Name'] || '',
    firstName: u['Name'] ? u['Name'].split(' ')[0] : '',
    lastName: u['Name'] ? u['Name'].split(' ').slice(1).join(' ') : '',
    email: u['Email'] || '',
    phone: u['Phone Number'] ? `+${u['Phone Number']}` : '',
    role: role,
    isSuperAdmin: role === 'ADMIN',
    isActive: u['Is Active'] === 'Yes',
    membershipFeeConfirmed: true,
    createdAt: createdStr,
    invitationId: id,
    permissions: []
  });
});

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

commitsData.forEach((c, idx) => {
  const amtStr = c['Savings Amount'] ? c['Savings Amount'].replace('£', '').replace(/,/g, '') : '0';
  const amount = parseFloat(amtStr);
  
  let status = c['Status'];
  if (status === 'Not Started' || status === 'Not yet started' || status === 'Not yet Started' || status === 'NOT_YET_STARTED') {
    status = 'PENDING';
  } else if (status) {
    status = status.toUpperCase();
  } else {
    status = 'PENDING';
  }

  const memberName = c['Member Name'] || '';
  const userMatch = usersArray.find(u => u.name.toLowerCase() === memberName.toLowerCase());
  const memberId = userMatch ? userMatch.id : `usr_${Math.floor(Math.random()*10000)}`;

  let cMonth = c['Collection Month'] ? c['Collection Month'].trim() : 'December';
  let cYear = 2024;
  let createdStr = new Date().toISOString();
  
  if (c['Created At']) {
    const parts = c['Created At'].split('-');
    if (parts.length === 3) {
      cYear = parseInt(parts[2]);
      createdStr = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString();
    }
  }

  commitsArray.push({
    id: c['Record Id'] || `SC-${Math.floor(Math.random()*10000)}`,
    memberId: memberId,
    amount: amount,
    goal: c['Savings Goal'] || 'Savings',
    collectionMonth: cMonth,
    collectionYear: cYear,
    endDate: c['End Date'] || '',
    status: status,
    createdAt: createdStr
  });

  // Generate Payments
  // The user requested:
  // "Sr.No. Payment Month Payment Year Payment Date
  // 1 January 2026 09/02/2026
  // 2 February 2026 03/03/2026"
  // If it's 2024 (like in the CSV), let's generate 2-3 payments
  
  const pYear = cYear;
  let pMonthIdx = monthNames.indexOf(cMonth) - 3;
  if (pMonthIdx < 0) pMonthIdx = 0;
  
  const numPayments = status === 'COMPLETED' ? 3 : (status === 'ACTIVE' ? 2 : (status === 'PENDING' ? 0 : 0));
  
  for (let i = 0; i < numPayments; i++) {
    let paymentMonthIdx = pMonthIdx + i;
    let paymentYear = pYear;
    if (paymentMonthIdx >= 12) {
      paymentMonthIdx -= 12;
      paymentYear += 1;
    }
    
    // Create realistic looking dates (e.g. 5th of next month)
    let pDateMonth = paymentMonthIdx + 2;
    let pDateYear = paymentYear;
    if (pDateMonth > 12) {
      pDateMonth -= 12;
      pDateYear += 1;
    }
    const payDate = new Date(`${pDateYear}-${String(pDateMonth).padStart(2, '0')}-05T12:00:00Z`);

    paymentsArray.push({
      id: `pay_${c['Record Id']}_${i}`,
      commitmentId: c['Record Id'],
      amount: amount,
      month: monthNames[paymentMonthIdx],
      year: paymentYear,
      status: 'CONFIRMED',
      createdAt: payDate.toISOString()
    });
  }
});

// Update db.ts
let newDbContent = dbContent;

// Replace users array
newDbContent = newDbContent.replace(/let cachedUsers: User\[\] = \[[\s\S]*?\];/g, `let cachedUsers: User[] = ${JSON.stringify(usersArray, null, 2)};`);

// Replace commitments array
newDbContent = newDbContent.replace(/let cachedCommitments: Commitment\[\] = \[[\s\S]*?\];/g, `let cachedCommitments: Commitment[] = ${JSON.stringify(commitsArray, null, 2)};`);

// Replace payments array
newDbContent = newDbContent.replace(/let cachedPayments: Payment\[\] = \[[\s\S]*?\];/g, `let cachedPayments: Payment[] = ${JSON.stringify(paymentsArray, null, 2)};`);

fs.writeFileSync(dbPath, newDbContent, 'utf8');
console.log('Database successfully re-seeded from CSVs!');
