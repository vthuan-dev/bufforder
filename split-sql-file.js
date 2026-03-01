const fs = require('fs');
const path = require('path');

console.log('✂️  Chia file SQL thành nhiều phần nhỏ...\n');

// Read the large SQL file
const sqlPath = path.join(__dirname, 'backend/prisma/amazon_products_full.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// Split by lines
const lines = sqlContent.split('\n');

// Find the INSERT statement start
let headerLines = [];
let valueLines = [];
let inValues = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.startsWith('INSERT INTO product')) {
    headerLines.push(line);
    inValues = true;
    continue;
  }
  
  if (!inValues) {
    headerLines.push(line);
  } else if (line && line !== ';') {
    // This is a value line
    valueLines.push(line);
  }
}

console.log(`📊 Total header lines: ${headerLines.length}`);
console.log(`📊 Total value lines: ${valueLines.length}`);

// Split values into chunks of 2000
const chunkSize = 2000;
const chunks = [];

for (let i = 0; i < valueLines.length; i += chunkSize) {
  chunks.push(valueLines.slice(i, i + chunkSize));
}

console.log(`📦 Splitting into ${chunks.length} files (${chunkSize} products each)\n`);

// Create output directory
const outputDir = path.join(__dirname, 'backend/prisma/split');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate SQL files
chunks.forEach((chunk, index) => {
  const partNumber = index + 1;
  const fileName = `amazon_products_part${partNumber}.sql`;
  const filePath = path.join(outputDir, fileName);
  
  // Build SQL content
  let sqlPart = '';
  
  // Add header (only DELETE and ALTER for first file)
  if (index === 0) {
    sqlPart += headerLines.slice(0, -1).join('\n') + '\n\n';
  } else {
    // For other files, just add comment
    sqlPart += `-- Amazon Products Part ${partNumber}\n`;
    sqlPart += `-- Products ${index * chunkSize + 1} to ${Math.min((index + 1) * chunkSize, valueLines.length)}\n\n`;
  }
  
  // Add INSERT statement
  sqlPart += 'INSERT INTO product (name, brand, category, price, image, productUrl, isActive, createdAt, updatedAt) VALUES\n';
  
  // Add values (remove trailing comma from last line)
  const values = chunk.map((line, i) => {
    if (i === chunk.length - 1) {
      return line.replace(/,$/, '');
    }
    return line;
  });
  
  sqlPart += values.join('\n');
  sqlPart += ';\n';
  
  // Write file
  fs.writeFileSync(filePath, sqlPart, 'utf-8');
  
  console.log(`✅ Created ${fileName} (${chunk.length} products)`);
});

console.log(`\n🎉 Successfully split into ${chunks.length} files!`);
console.log(`📁 Files location: backend/prisma/split/\n`);

// Create import script
const importScript = `#!/bin/bash

echo "🌱 Importing Amazon products in batches..."
echo ""

cd /var/www/greeting-message/backend/prisma/split

# Import each part
${chunks.map((_, i) => {
  const partNum = i + 1;
  return `echo "📦 Importing part ${partNum}/${chunks.length}..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part${partNum}.sql
if [ $? -eq 0 ]; then
    echo "✅ Part ${partNum} imported successfully"
else
    echo "❌ Error importing part ${partNum}"
    exit 1
fi
echo ""`;
}).join('\n\n')}

echo "🎉 All parts imported successfully!"
echo ""
echo "📊 Checking total products..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "SELECT COUNT(*) as total_products FROM product;"
`;

const scriptPath = path.join(outputDir, 'import-all.sh');
fs.writeFileSync(scriptPath, importScript, 'utf-8');

console.log(`📝 Created import script: backend/prisma/split/import-all.sh`);
console.log(`\n📋 Next steps:`);
console.log(`  1. Commit and push: git add backend/prisma/split && git commit -m "Split SQL into parts" && git push`);
console.log(`  2. On VPS: cd /var/www/greeting-message && git pull`);
console.log(`  3. On VPS: bash backend/prisma/split/import-all.sh`);
