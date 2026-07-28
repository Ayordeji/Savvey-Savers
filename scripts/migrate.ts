import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseCSV(csvText: string) {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
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
    
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    results.push(obj);
  }
  return results;
}

function parseTSV(tsvText: string) {
  const lines = tsvText.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split('\t').map(h => h.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    results.push(obj);
  }
  return results;
}

async function main() {
  console.log('Starting migration to Supabase and Prisma...');

  const memberCsv = fs.readFileSync(path.join(__dirname, '../public/member_list.csv'), 'utf8');
  const commitTxt = fs.readFileSync(path.join(__dirname, '../public/exported_data.csv'), 'utf8');
  
  const usersData = parseCSV(memberCsv);
  const commitsData = parseTSV(commitTxt);

  console.log(`Parsed CSVs successfully. Users: ${usersData.length}, Commitments: ${commitsData.length}`);

  const emailToIdMap = new Map<string, string>();

  // 1. Insert Users
  for (const row of usersData) {
    if (!row['Email']) continue;
    const email = row['Email'].toLowerCase().trim();
    const fullName = row['Name'] || '';
    const phone = row['Phone Number'] || '';
    const dateJoinedStr = row['Created ON'] || new Date().toISOString();
    
    // Parse 'DD/MM/YYYY HH:MM:SS' to ISO string, or keep as is if it fails
    let dateJoined = dateJoinedStr;
    if (dateJoinedStr.includes('/')) {
       const [datePart, timePart] = dateJoinedStr.split(' ');
       if (datePart) {
          const [day, month, year] = datePart.split('/');
          if (year && month && day) {
             dateJoined = new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}Z`).toISOString();
          }
       }
    }
    
    console.log(`Processing user: ${email}`);
    
    // Generate a random UUID since they will be linked by email when they sign up on Supabase
    let userId = emailToIdMap.get(email) || uuidv4();
    emailToIdMap.set(email, userId);
    
    console.log(`Inserting into Prisma for user: ${email} with ID: ${userId}`);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: userId,
        email,
        name: fullName,
        phone,
        passwordHash: 'Password123!',
        role: 'MEMBER',
        isActive: true,
        createdAt: new Date(dateJoined),
        updatedAt: new Date(),
      }
    });
    console.log(`Migrated User: ${email}`);
  }

  // 2. Insert Admin User manually to ensure we have an admin
  const adminEmail = 'admin@savveysavers.com';
  let adminId = emailToIdMap.get(adminEmail) || uuidv4();
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      id: adminId,
      email: adminEmail,
      name: 'Super Admin',
      role: 'ADMIN',
      isActive: true,
      isSuperAdmin: true,
    }
  });

  // 3. Insert Commitments
  let commitmentCount = 0;
  for (const row of commitsData) {
    if (!row['Record Id']) continue;
    
    const id = row['Record Id'];
    const memberName = row['Member Name'];
    const amountStr = row['Savings Amount'] || '';
    const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) || 0;
    const goal = row['Savings Goal'] || 'Savings Goals';
    const collectionMonth = row['Collection Month']?.trim() || 'January';
    const statusStr = row['Status']?.toUpperCase() || 'PENDING';
    
    let mappedStatus = statusStr;
    if (mappedStatus === 'NOT YET STARTED') mappedStatus = 'PENDING';
    
    let createdAt = new Date();
    if (row['Created At']) {
      const parts = row['Created At'].split('/');
      if (parts.length === 3) {
         createdAt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }

    let endDate = null;
    if (row['End Date']) {
       const parts = row['End Date'].split('-');
       if (parts.length === 3) {
         endDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
       }
    }
    
    const memberRow = usersData.find(u => (u['Name'] || '').toLowerCase() === memberName.toLowerCase());
    const memberEmail = memberRow ? memberRow['Email']?.toLowerCase() : null;
    let memberId = memberEmail ? emailToIdMap.get(memberEmail) : null;
    
    if (!memberId) {
      console.log(`Could not map commitment ${id} to a valid member. Searching DB...`);
      const existingUser = await prisma.user.findFirst({ where: { name: memberName }});
      if (existingUser) {
         memberId = existingUser.id;
      } else {
         continue; // skip
      }
    }

    await prisma.commitment.upsert({
      where: { id },
      update: {},
      create: {
        id,
        memberId,
        memberName,
        amount,
        goal,
        collectionMonth,
        collectionYear: 2026,
        endDate,
        status: mappedStatus,
        createdAt,
        updatedAt: new Date()
      }
    });
    commitmentCount++;
  }
  
  console.log(`Migration Complete. Imported ${usersData.length} users and ${commitmentCount} commitments.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
