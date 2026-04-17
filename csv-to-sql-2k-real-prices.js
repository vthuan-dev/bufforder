/**
 * Convert 2000 products from CSV to SQL with REAL prices
 * No price randomization - uses actual prices from CSV
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Converting 2000 products from CSV to SQL...\n');

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  
  return fields;
}

function parsePrice(priceStr) {
  if (!priceStr) return 99.99;
  
  // Remove $, commas, spaces
  const cleaned = priceStr.replace(/[$,\s]/g, '');
  const price = parseFloat(cleaned);
  
  return isNaN(price) ? 99.99 : price;
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// Read CSV
const csvPath = path.join(__dirname, 'backend/prisma/archive/amazon_products_cleaned.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').slice(1); // Skip header

console.log(`📊 Total products in CSV: ${lines.length}`);

// Take first 2000 products
const selectedLines = lines.slice(0, 2000);
const products = [];

console.log('📦 Processing 2000 products...\n');

for (let i = 0; i < selectedLines.length; i++) {
  const line = selectedLines[i];
  if (!line.trim()) continue;
  
  const fields = parseCSVLine(line);
  
  // CSV structure: index, category, subcategory, name, url, price, rating, ratings, image
  const category = fields[1] || 'Electronics';
  const subcategory = fields[2] || 'General';
  const name = fields[3] || `Product ${i + 1}`;
  const productUrl = fields[4] || 'https://www.amazon.com';
  const priceStr = fields[5] || '$99.99';
  const image = fields[8] || 'https://via.placeholder.com/400';
  
  // Parse REAL price from CSV (no randomization)
  const price = parsePrice(priceStr);
  
  products.push({
    name: escapeSQL(name.substring(0, 500)),
    brand: escapeSQL(subcategory.substring(0, 100)),
    category: escapeSQL(category.substring(0, 100)),
    price: price,
    image: escapeSQL(image),
    productUrl: escapeSQL(productUrl)
  });
  
  if ((i + 1) % 200 === 0) {
    console.log(`   Processed: ${i + 1}/2000 products`);
  }
}

console.log(`\n✅ Processed: ${products.length} products`);

// Generate SQL
let sqlContent = `-- Amazon Products (2000 products with REAL prices from CSV)
-- Generated from amazon_products_cleaned.csv
-- Prices are actual Amazon prices (not randomized)

-- Delete existing products
DELETE FROM product;

-- Reset auto increment
ALTER TABLE product AUTO_INCREMENT = 1;

-- Insert products
INSERT INTO product (name, brand, category, price, image, productUrl, isActive, createdAt, updatedAt) VALUES
`;

const valueLines = products.map(p => 
  `('${p.name}', '${p.brand}', '${p.category}', ${p.price}, '${p.image}', '${p.productUrl}', 1, NOW(), NOW())`
);

sqlContent += valueLines.join(',\n');
sqlContent += ';\n';

// Write SQL file
const outputPath = path.join(__dirname, 'backend/prisma/amazon_2k_real_prices.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf-8');

// Calculate statistics
const prices = products.map(p => p.price);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

console.log('\n📊 STATISTICS:');
console.log(`   Products: ${products.length}`);
console.log(`   Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
console.log(`   Average price: $${avgPrice.toFixed(2)}`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

console.log('\n✅ Created: backend/prisma/amazon_2k_real_prices.sql');
console.log('\n🚀 To import on VPS:');
console.log('   cd /var/www/greeting-message');
console.log('   mysql -u greeting_user -p\'Greeting@2024!Strong\' greeting_message < backend/prisma/amazon_2k_real_prices.sql');
