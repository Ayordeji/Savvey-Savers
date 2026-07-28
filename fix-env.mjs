import fs from 'fs';
let env = fs.readFileSync('.env', 'utf8');
env = env.replace(
  'DATABASE_URL="postgresql://postgres.hotrmjxzzspjziywqiob:sainteluyemi2002@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"',
  'DATABASE_URL="postgresql://postgres.hotrmjxzzspjziywqiob:sainteluyemi2002@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"'
);
fs.writeFileSync('.env', env, 'utf8');
console.log('Fixed .env DATABASE_URL to use direct URL on port 5432.');
