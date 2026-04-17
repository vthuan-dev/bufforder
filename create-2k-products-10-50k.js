/**
 * Create 2000 real Amazon products with price range $10 - $50,000
 * Uses real product names, images, and URLs from CSV
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Creating 2000 Amazon products ($10 - $50k)...\n');

// Read CSV file
const csvPath = path.join(__dirname, 'backend/prisma/archive/amazon_products_cleaned.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n').slice(1); // Skip header
console.log(`📊 Total products in CSV: ${lines.length}`);

// Price distribution: $10 - $50,000
const priceRanges = [
  { min: 10, max: 100, weight: 0.20 },      // 20%: $10-$100
  { min: 100, max: 500, weight: 0.25 },     // 25%: $100-$500
  { min: 500, max: 1000, weight: 0.15 },    // 15%: $500-$1k
  { min: 1000, max: 5000, weight: 0.15 },   // 15%: $1k-$5k
  { min: 5000, max: 15000, weight: 0.10 },  // 10%: $5k-$15k
  { min: 15000, max: 50000, weight: 0.15 }  // 15%: $15k-$50k
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
  
  return 99.99;
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

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

// Take first 2000 products
const selectedLines = lines.slice(0, 2000);
const products = [];

console.log('📦 Processing products...\n');

for (let i = 0; i < selectedLines.length; i++) {
  const line = selectedLines[i];
  if (!line.trim()) continue;
  
  const fields = parseCSVLine(line);
  
  // CSV structure: index, category, subcategory, name, url, price, rating, ratings, image
  const category = fields[1] || 'Electronics';
  const subcategory = fields[2] || 'General';
  const name = fields[3] || `Product ${i + 1}`;
  const productUrl = fields[4] || 'https://www.amazon.com';
  const image = fields[8] || 'https://via.placeholder.com/400';
  
  // Generate diverse price
  const price = getRandomPrice();
  
  products.push({
    name: escapeSQL(name),
    brand: escapeSQL(subcategory),
    category: escapeSQL(category),
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
let sqlContent = `-- Amazon Products Seed Data (2000 products)
-- Price range: $10 - $50,000
-- Real product names, images, and URLs from Amazon

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
const outputPath = path.join(__dirname, 'backend/prisma/amazon_2k_10-50k.sql');
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

console.log('\n✅ Created: backend/prisma/amazon_2k_10-50k.sql');
console.log('\n🚀 To seed on VPS:');
console.log('   cd /var/www/greeting-message');
console.log('   mysql -u greeting_user -p\'Greeting@2024!Strong\' greeting_message < backend/prisma/amazon_2k_10-50k.sql');
