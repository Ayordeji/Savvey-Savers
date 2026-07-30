const { Client } = require('pg');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres.hotrmjxzzspjziywqiob:sainteluyemi2002@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await c.connect();
  
  // Clear displayId for ALL commitments. The GET endpoint will automatically and correctly backfill displayIds only for UUID records!
  await c.query('UPDATE "Commitment" SET "displayId" = NULL');
  console.log("Cleared all displayIds.");
  
  await c.end();
}
run().catch(console.error);
