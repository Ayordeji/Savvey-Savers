const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../src/lib/db.ts');
let dbContent = fs.readFileSync(dbPath, 'utf8');

const memberCsv = fs.readFileSync(path.join(__dirname, '../public/member_list.csv'), 'utf8');
const commitTxt = fs.readFileSync(path.join(__dirname, '../public/exported_data.csv'), 'utf8'); // We'll just assume it's tab-separated now

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

function parseTSV(tsvText) {
  const lines = tsvText.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split('\t').map(h => h.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    results.push(obj);
  }
  return results;
}

const usersData = parseCSV(memberCsv);
const commitsData = parseTSV(commitTxt); // Use TSV for the new pasted data

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

  let lastLoggedStr = null;
  if (u['Last logged']) {
    const parts = u['Last logged'].split(' ')[0].split('/');
    if (parts.length === 3) lastLoggedStr = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString();
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
    lastLoginAt: lastLoggedStr,
    invitedBy: u['Invited By'] || '',
    invitationId: id,
    permissions: []
  });
});

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

commitsData.forEach((c, idx) => {
  const amtStr = c['Savings Amount'] ? c['Savings Amount'].replace('£', '').replace(/,/g, '') : '0';
  const amount = parseFloat(amtStr);
  
  let statusRaw = c['Status'];
  let status = 'PENDING';

  const memberName = c['Member Name'] || 'Unknown Member';
  const userMatch = usersArray.find(u => u.name.toLowerCase() === memberName.toLowerCase() || memberName.toLowerCase().includes(u.firstName.toLowerCase()));
  const memberId = userMatch ? userMatch.id : `usr_${Math.floor(Math.random()*10000)}`;

  let cMonthRaw = c['Collection Month'] ? c['Collection Month'].trim() : 'December';
  let cMonth = cMonthRaw;
  let cYear = 2024;
  let createdStr = new Date().toISOString();
  
  // Clean up month string (e.g. "Oct-25")
  if (cMonthRaw.includes('-')) {
    const parts = cMonthRaw.split('-');
    const mIndex = shortMonthNames.findIndex(sm => sm.toLowerCase() === parts[0].toLowerCase());
    if (mIndex >= 0) cMonth = monthNames[mIndex];
    cYear = 2000 + parseInt(parts[1]);
  }
  
  if (c['Created At']) {
    const parts = c['Created At'].split('/');
    if (parts.length === 3) {
      cYear = parseInt(parts[2]);
      createdStr = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00Z`).toISOString();
    }
  }

  // Dynamic Status Evaluation
  if (statusRaw && statusRaw.toUpperCase() === 'CANCELLED') {
    status = 'CANCELLED';
  } else if (cYear < 2026) {
    status = 'COMPLETED';
  } else if (cYear === 2026) {
    status = 'ACTIVE';
  } else {
    status = 'PENDING';
  }

  commitsArray.push({
    id: c['Record Id'] || `SC-${Math.floor(Math.random()*10000)}`,
    memberId: memberId,
    memberName: memberName,
    amount: amount,
    goal: c['Savings Goal'] || 'Savings',
    collectionMonth: cMonth,
    collectionYear: cYear,
    endDate: c['End Date'] || '',
    status: status,
    createdAt: createdStr
  });

  // Generate Payments
  let pYear = cYear;
  
  // Completed (previous years) get 12 payments. Active (current year) gets Jan & Feb. Pending (future) gets 0.
  const numPayments = status === 'COMPLETED' ? 12 : (status === 'ACTIVE' ? 2 : 0);
  
  for (let i = 0; i < numPayments; i++) {
    // Start generating payments from January of the collection year
    let paymentMonthIdx = i; // Jan is 0, Feb is 1
    let paymentYear = pYear;
    if (paymentMonthIdx >= 12) {
      paymentMonthIdx -= 12;
      paymentYear += 1;
    }
    
    // Pay date is 5th of that month
    let pDateMonth = paymentMonthIdx + 1;
    let pDateYear = paymentYear;
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

newDbContent = newDbContent.replace(/let cachedUsers: User\[\] = \[[\s\S]*?\];/g, `let cachedUsers: User[] = ${JSON.stringify(usersArray, null, 2)};`);
newDbContent = newDbContent.replace(/let cachedCommitments: Commitment\[\] = \[[\s\S]*?\];/g, `let cachedCommitments: Commitment[] = ${JSON.stringify(commitsArray, null, 2)};`);
newDbContent = newDbContent.replace(/let cachedPayments: Payment\[\] = \[[\s\S]*?\];/g, `let cachedPayments: Payment[] = ${JSON.stringify(paymentsArray, null, 2)};`);

fs.writeFileSync(dbPath, newDbContent, 'utf8');
console.log('Database successfully re-seeded from CSV and TSV texts!');
