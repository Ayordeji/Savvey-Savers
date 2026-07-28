import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

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
  const memberCsv = fs.readFileSync(path.join(__dirname, '../public/member_list.csv'), 'utf8');
  const commitTxt = fs.readFileSync(path.join(__dirname, '../public/exported_data.csv'), 'utf8');
  
  const usersData = parseCSV(memberCsv);
  const commitsData = parseTSV(commitTxt);

  const emailToIdMap = new Map<string, string>();

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Insert Users
    for (const row of usersData) {
      if (!row['Email']) continue;
      const email = row['Email'].toLowerCase().trim();
      const fullName = row['Name'] || '';
      const phone = row['Phone Number'] || '';
      const dateJoinedStr = row['Created ON'] || new Date().toISOString();
      
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
      
      const userId = uuidv4();
      emailToIdMap.set(email, userId);
      
      await client.query(
        `INSERT INTO "User" (id, email, name, phone, "passwordHash", role, "isActive", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         ON CONFLICT (email) DO NOTHING`,
        [userId, email, fullName, phone, 'Password123!', 'MEMBER', true, dateJoined, new Date().toISOString()]
      );
    }
    
    // Admin User
    const adminEmail = 'admin@savveysavers.com';
    const adminId = emailToIdMap.get(adminEmail) || uuidv4();
    await client.query(
      `INSERT INTO "User" (id, email, name, role, "isActive", "isSuperAdmin", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', "isSuperAdmin" = true`,
      [adminId, adminEmail, 'Super Admin', 'ADMIN', true, true, new Date().toISOString(), new Date().toISOString()]
    );
    
    const adminRes = await client.query(`SELECT id FROM "User" WHERE email = $1`, [adminEmail]);
    const actualAdminId = adminRes.rows[0].id;
    
    // Fetch all user mappings again just in case
    const res = await client.query(`SELECT id, email, name FROM "User"`);
    const dbEmailToId = new Map<string, string>();
    const dbNameToId = new Map<string, string>();
    res.rows.forEach(r => {
      dbEmailToId.set(r.email, r.id);
      dbNameToId.set(r.name.toLowerCase(), r.id);
    });

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
      
      let createdAt = new Date().toISOString();
      if (row['Created At']) {
        const parts = row['Created At'].split('/');
        if (parts.length === 3) {
           createdAt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
        }
      }
  
      let endDate = null;
      if (row['End Date']) {
         const parts = row['End Date'].split('-');
         if (parts.length === 3) {
           endDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
         }
      }
      
      let memberId = dbNameToId.get(memberName.toLowerCase()) || actualAdminId;
      
      await client.query(
        `INSERT INTO "Commitment" (id, "memberId", "memberName", amount, goal, "collectionMonth", "collectionYear", "endDate", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET amount = $4, status = $9, "updatedAt" = $11`,
        [id, memberId, memberName, amount, goal, collectionMonth, 2026, endDate, mappedStatus, createdAt, new Date().toISOString()]
      );
      commitmentCount++;
    }
    
    await client.query('COMMIT');
    console.log(`Successfully migrated ${usersData.length} users and ${commitmentCount} commitments.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

main().catch(console.error).finally(() => pool.end());
