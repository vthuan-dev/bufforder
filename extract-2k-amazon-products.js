/**
 * Extract first 2000 products from amazon_products_full.sql
 * Creates a smaller SQL file for faster seeding
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Extracting 2000 Amazon products...\n');

// Read the full SQL file
const sqlPath = path.join(__dirname, 'backend/prisma/amazon_products_full.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// Split by lines
const lines = sqlContent.split('\n');

// Find the INSERT statement
let headerLines = [];
let valueLines = [];
let inInsert = false;

for (const line of lines) {
  if (line.startsWith('INSERT INTO product')) {
    inInsert = true;
    headerLines.push(line);
    continue;
  }
  
  if (!inInsert) {
    headerLines.push(line);
  } else if (line.trim().startsWith('(')) {
    valueLines.push(line);
  }
}

// Take first 2000 products
const first2000 = valueLines.slice(0, 2000);

// Build new SQL content
let newSql = headerLines.join('\n') + '\n';
newSql += first2000.join('\n');

// Remove trailing comma and add semicolon
newSql = newSql.replace(/,\s*$/, ';\n');

// Write to new file
const outputPath = path.join(__dirname, 'backend/prisma/amazon_products_2k.sql');
fs.writeFileSync(outputPath, newSql, 'utf-8');

console.log('✅ Created: backend/prisma/amazon_products_2k.sql');
console.log(`📊 Products: 2000`);
console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log('\n🚀 To seed on VPS:');
console.log('   mysql -u greeting_user -p\'Greeting@2024!Strong\' greeting_message < backend/prisma/amazon_products_2k.sql');
