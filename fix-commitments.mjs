import fs from 'fs';
let p = 'src/app/dashboard/commitments/page.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  /\<th onClick=\{\(\) \=\> requestSort\('endDate'\)\} style=\{\{ cursor: 'pointer', userSelect: 'none' \}\}\>[\s\S]*?\<\/th\>/g,
  `<th onClick={() => requestSort('collectionYear')} style={{ cursor: 'pointer', userSelect: 'none' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span>Collection Year</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
        {sortConfig?.key === 'collectionYear' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
      </span>
    </div>
  </th>`
);

c = c.replace(
  /\<td onClick=\{\(\) \=\> handleRowClick\(c\.id\)\}>\{c\.endDate \|\| \`December \$\{c\.collectionYear\}\`\}\<\/td\>/g,
  "<td onClick={() => handleRowClick(c.id)}>{c.collectionYear}</td>"
);

c = c.replace(
  /\<div\>\s*\<span style=\{\{ fontSize: '0.75rem', color: 'var\(--text-muted\)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' \}\}\>Savings Goal\<\/span\>\s*\<div style=\{\{ fontWeight: 600, color: 'var\(--text-main\)', marginTop: '4px' \}\}\>\{selectedCmt\.goal\}\<\/div\>\s*\<\/div\>/g,
  ""
);

c = c.replace(
  /\<span style=\{\{ fontSize: '0.75rem', color: 'var\(--text-muted\)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' \}\}\>Monthly Savings Amount\<\/span\>/g,
  "<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Amount (£)</span>"
);

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed main commitments UI');
