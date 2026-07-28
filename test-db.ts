import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
async function main() {
  const res = await pool.query('SELECT "id", "goal", "status" FROM "Commitment" LIMIT 5');
  console.log(res.rows);
}
main().catch(console.error).finally(() => pool.end());
