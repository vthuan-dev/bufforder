const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing long product names in SQL files...\n');

const splitDir = path.join(__dirname, 'backend/prisma/split');
const files = fs.readdirSync(splitDir).filter(f => f.endsWith('.sql') && f.startsWith('amazon_products_part'));

let totalFixed = 0;

files.forEach(fileName => {
  const filePath = path.join(splitDir, fileName);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixed = 0;
  
  // Find all product names and truncate if needed
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    if (line.includes("('") && line.includes("',")) {
      // This is a value line
      // Extract the name (first value in parentheses)
      const match = line.match(/\('([^']*(?:\\.[^']*)*)'/);
      if (match && match[1]) {
        const name = match[1];
        if (name.length > 250) {
          // Truncate to 250 characters (safe limit)
          const truncated = name.substring(0, 247) + '...';
          const newLine = line.replace(match[0], `('${truncated}'`);
          fixed++;
          return newLine;
        }
      }
    }
    return line;
  });
  
  if (fixed > 0) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    console.log(`✅ Fixed ${fixed} long names in ${fileName}`);
    totalFixed += fixed;
  }
});

console.log(`\n🎉 Total fixed: ${totalFixed} product names`);

if (totalFixed > 0) {
  console.log(`\n📋 Next steps:`);
  console.log(`  1. Commit: git add backend/prisma/split && git commit -m "Fix long product names" && git push`);
  console.log(`  2. On VPS: git pull && bash backend/prisma/split/import-all.sh`);
} else {
  console.log(`\n✅ No long names found. The error might be from database schema.`);
  console.log(`\nTry increasing column size on VPS:`);
  console.log(`  mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "ALTER TABLE product MODIFY name VARCHAR(500);"`);
}
