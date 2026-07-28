import fs from 'fs';
import path from 'path';
import { db } from './src/lib/db';

async function main() {
  const content = fs.readFileSync(path.join(process.cwd(), 'public/exported_data.csv'), 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  
  let updated = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 4) {
      let recordId = parts[0].trim();
      const goal = parts[3].trim();
      if (!recordId || !goal) continue;
      
      // Auto-prefix ID with SCC- if old format (though in db it's just SC- or SCC-)
      let id = recordId;
      if (id.startsWith('cmt_')) {
        id = `SCC-${id.substring(4)}`;
      }
      
      try {
        await db.commitment.update({
          where: { id },
          data: { goal }
        });
        updated++;
      } catch (err) {
        // Ignored if not found
      }
    }
  }
  console.log(`Successfully updated ${updated} savings goals.`);
}
main().catch(console.error).finally(() => process.exit(0));
