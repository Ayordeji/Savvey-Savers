import fs from 'fs';
let p = 'src/app/dashboard/reports/commitments/page.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  /\<div\>\s*\<span style=\{\{ fontSize: '0.75rem', color: 'var\(--text-muted\)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' \}\}\>Savings Goal\<\/span\>\s*\<div style=\{\{ fontWeight: 600, color: 'var\(--text-main\)', marginTop: '4px' \}\}\>\{selectedCmt\.goal\}\<\/div\>\s*\<\/div\>/g,
  ""
);

c = c.replace(
  /\<span style=\{\{ fontSize: '0.75rem', color: 'var\(--text-muted\)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' \}\}\>Monthly Savings Amount\<\/span\>/g,
  "<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Amount (£)</span>"
);

c = c.replace(
  /RECORD ID/g, "Record ID"
);

c = c.replace(
  /MEMBER NAME/g, "Member Name"
);

c = c.replace(
  /COLLECTION MONTH/g, "Collection Month"
);

c = c.replace(
  /STATUS/g, "Status"
);

fs.writeFileSync(p, c, 'utf8');
