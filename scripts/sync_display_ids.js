const { Client } = require('pg');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres.hotrmjxzzspjziywqiob:sainteluyemi2002@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await c.connect();
  
  // Update legacy records to have displayId = id
  await c.query('UPDATE "Commitment" SET "displayId" = id WHERE id LIKE \'SC-%\'');
  console.log("Updated legacy displayIds.");
  
  await c.end();
}
run().catch(console.error);
