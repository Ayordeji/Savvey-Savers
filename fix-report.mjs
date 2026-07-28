import fs from 'fs';

let p = 'src/app/dashboard/reports/commitments/page.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Fix CSV Export headers
c = c.replace(
  "const headers = ['RECORD ID', 'MEMBER NAME', 'SAVINGS AMOUNT', 'SAVINGS GOAL', 'COLLECTION MONTH', 'END DATE', 'STATUS'];",
  "const headers = ['Record ID', 'Member Name', 'Savings Amount (£)', 'Collection Month', 'Collection Year', 'Status'];"
);

// Fix CSV rows
c = c.replace(
  /\`\$\{c\.amount\}\`\,\n\s*\`\$\{c\.goal\}\`\,\n\s*\`\$\{c\.collectionMonth\} \$\{c\.collectionYear\}\`\,\n\s*\`\$\{c\.endDate\}\`/g,
  "`${c.amount}`,\n      `${c.collectionMonth}`,\n      `${c.collectionYear}`"
);

// 2. Remove SAVINGS GOAL from table headers
c = c.replace(
  /\<th onClick=\{\(\) \=\> requestSort\('goal'\)\} style=\{\{ cursor: 'pointer', userSelect: 'none' \}\}\>[\s\S]*?\<\/th\>/g,
  ""
);

// 3. Remove goal cell from table body
c = c.replace(/\<td\>\{cmt\.goal\}\<\/td\>/g, "");

// 4. Change SAVINGS AMOUNT header to Savings Amount (£)
c = c.replace(
  /\<span\>SAVINGS AMOUNT\<\/span\>/g,
  "<span>Savings Amount (£)</span>"
);

// 5. Change END DATE header to Collection Year
c = c.replace(
  /\<span\>END DATE\<\/span\>/g,
  "<span>Collection Year</span>"
);

// 6. Change cmt.endDate to cmt.collectionYear in table body
c = c.replace(
  /\<td className=\{styles\.dateCell\}\>\{cmt\.endDate \|\| \`December \$\{cmt\.collectionYear\}\`\}\<\/td\>/g,
  "<td className={styles.dateCell}>{cmt.collectionYear}</td>"
);

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed reports UI');
