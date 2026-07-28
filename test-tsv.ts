import * as fs from 'fs';
function parseTSV(tsvText: string) {
  const lines = tsvText.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split('\t').map(h => h.trim());
  console.log("Headers:", headers);
  const results = [];
  for (let i = 1; i < 3; i++) {
    const values = lines[i].split('\t');
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    results.push(obj);
  }
  console.log(results);
}
parseTSV(fs.readFileSync('public/exported_data.csv', 'utf8'));
