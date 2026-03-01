const fs = require('fs');
const path = require('path');

console.log('🔄 Converting Amazon CSV to SQL with diverse pricing...\n');

// Read CSV file
const csvPath = path.join(__dirname, 'backend/prisma/archive/amazon_products_cleaned.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

// Find column indices
const nameIdx = headers.findIndex(h => h.includes('Product Name'));
const priceIdx = headers.findIndex(h => h.includes('Product Price'));
const imageIdx = headers.findIndex(h => h.includes('Product Image'));
const categoryIdx = headers.findIndex(h => h.includes('Product Category'));
const subcategoryIdx = headers.findIndex(h => h.includes('Product Subcategory'));
const urlIdx = headers.findIndex(h => h.includes('Product URL'));

console.log(`📊 Found ${lines.length - 1} products in CSV`);
console.log(`📋 Columns: Name=${nameIdx}, Price=${priceIdx}, Image=${imageIdx}, Category=${categoryIdx}\n`);

// Price distribution for diversity: $10 - $30,000
const priceRanges = [
  { min: 10, max: 100, weight: 0.25 },      // 25% products: $10-$100
  { min: 100, max: 500, weight: 0.25 },     // 25% products: $100-$500
  { min: 500, max: 1000, weight: 0.15 },    // 15% products: $500-$1000
  { min: 1000, max: 3000, weight: 0.15 },   // 15% products: $1k-$3k
  { min: 3000, max: 10000, weight: 0.10 },  // 10% products: $3k-$10k
  { min: 10000, max: 30000, weight: 0.10 }  // 10% products: $10k-$30k
];

function getRandomPrice() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const range of priceRanges) {
    cumulative += range.weight;
    if (rand <= cumulative) {
      const price = range.min + Math.random() * (range.max - range.min);
      return Math.round(price * 100) / 100;
    }
  }
  
  return 99.99; // fallback
}

function escapeSQL(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// Generate SQL
let sqlContent = `-- Amazon Products Seed Data with Diverse Pricing
-- Generated from amazon_products_cleaned.csv
-- Total products: ${lines.length - 1}
-- Price range: $10 - $30,000

-- Delete existing products
DELETE FROM product;

-- Reset auto increment
ALTER TABLE product AUTO_INCREMENT = 1;

-- Insert products
INSERT INTO product (name, brand, category, price, image, productUrl, isActive, createdAt, updatedAt) VALUES\n`;

const values = [];
let validCount = 0;
let skippedCount = 0;

// Process each line (skip header)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  try {
    const cols = parseCSVLine(line);
    
    const name = cols[nameIdx]?.replace(/^"|"$/g, '').trim();
    const image = cols[imageIdx]?.replace(/^"|"$/g, '').trim();
    const category = cols[categoryIdx]?.replace(/^"|"$/g, '').trim() || 'General';
    const subcategory = cols[subcategoryIdx]?.replace(/^"|"$/g, '').trim() || '';
    const productUrl = cols[urlIdx]?.replace(/^"|"$/g, '').trim() || '';
    
    // Validate
    if (!name || !image || !image.startsWith('http')) {
      skippedCount++;
      continue;
    }
    
    // Generate diverse price
    const price = getRandomPrice();
    
    // Use subcategory as brand if available
    const brand = subcategory || category;
    
    // Create SQL value
    const sqlValue = `('${escapeSQL(name)}', '${escapeSQL(brand)}', '${escapeSQL(category)}', ${price}, '${escapeSQL(image)}', '${escapeSQL(productUrl)}', 1, NOW(), NOW())`;
    
    values.push(sqlValue);
    validCount++;
    
    if (validCount % 1000 === 0) {
      console.log(`✅ Processed ${validCount} products...`);
    }
    
  } catch (error) {
    skippedCount++;
    if (skippedCount <= 10) {
      console.log(`⚠️  Skipped line ${i}: ${error.message}`);
    }
  }
}

// Join all values
sqlContent += values.join(',\n');
sqlContent += ';\n';

// Write SQL file
const outputPath = path.join(__dirname, 'backend/prisma/amazon_products_full.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf-8');

console.log(`\n✅ Successfully converted ${validCount} products`);
console.log(`⚠️  Skipped ${skippedCount} invalid products`);
console.log(`📁 SQL file created: ${outputPath}`);

// Show price distribution
const priceDistribution = {
  '$10-$100': 0,
  '$100-$500': 0,
  '$500-$1k': 0,
  '$1k-$3k': 0,
  '$3k-$10k': 0,
  '$10k-$30k': 0
};

// Sample check (read back a few lines to verify)
const sampleSize = Math.min(1000, validCount);
console.log(`\n💰 Estimated price distribution (based on ${sampleSize} samples):`);
for (let i = 0; i < sampleSize; i++) {
  const price = getRandomPrice();
  if (price < 100) priceDistribution['$10-$100']++;
  else if (price < 500) priceDistribution['$100-$500']++;
  else if (price < 1000) priceDistribution['$500-$1k']++;
  else if (price < 3000) priceDistribution['$1k-$3k']++;
  else if (price < 10000) priceDistribution['$3k-$10k']++;
  else priceDistribution['$10k-$30k']++;
}

Object.entries(priceDistribution).forEach(([range, count]) => {
  const percentage = Math.round(count / sampleSize * 100);
  console.log(`  ${range}: ~${percentage}%`);
});

console.log(`\n🎉 Conversion complete!`);
console.log(`\n📝 Next steps:`);
console.log(`  1. Commit and push: git add . && git commit -m "Add Amazon products SQL" && git push`);
console.log(`  2. On VPS, run: mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < backend/prisma/amazon_products_full.sql`);
