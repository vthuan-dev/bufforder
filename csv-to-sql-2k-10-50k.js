/**
 * Extract 2000 products from CSV with price range $10 - $50,000
 * Filters products by price and creates SQL file
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Creating 2000 products from CSV ($10 - $50k)...\n');

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
  if (!priceStr) return 0;
  
  // Remove $, commas, spaces
  const cleaned = priceStr.replace(/[$,\s]/g, '');
  const price = parseFloat(cleaned);
  
  return isNaN(price) ? 0 : price;
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
console.log('🔍 Filtering products with price $10 - $50,000...\n');

// Parse all products and filter by price
const allProducts = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const fields = parseCSVLine(line);
  
  // CSV structure: index, category, subcategory, name, url, price, rating, ratings, image
  const category = fields[1] || 'Electronics';
  const subcategory = fields[2] || 'General';
  const name = fields[3] || `Product ${i + 1}`;
  const productUrl = fields[4] || 'https://www.amazon.com';
  const priceStr = fields[5] || '$0';
  const image = fields[8] || 'https://via.placeholder.com/400';
  
  // Parse price
  const price = parsePrice(priceStr);
  
  // Filter: only products with price between $10 and $50,000
  if (price >= 10 && price <= 50000) {
    allProducts.push({
      name: escapeSQL(name.substring(0, 500)),
      brand: escapeSQL(subcategory.substring(0, 100)),
      category: escapeSQL(category.substring(0, 100)),
      price: price,
      image: escapeSQL(image),
      productUrl: escapeSQL(productUrl)
    });
  }
  
  if ((i + 1) % 5000 === 0) {
    console.log(`   Scanned: ${i + 1}/${lines.length} lines, Found: ${allProducts.length} products in range`);
  }
}

console.log(`\n✅ Found ${allProducts.length} products in price range $10 - $50,000`);

// Sort by price to get diverse range
allProducts.sort((a, b) => a.price - b.price);

// Select 2000 products with diverse pricing
const selectedProducts = [];
const step = Math.floor(allProducts.length / 2000);

for (let i = 0; i < 2000 && i * step < allProducts.length; i++) {
  const index = i * step;
  selectedProducts.push(allProducts[index]);
}

// If we don't have enough, fill with remaining products
while (selectedProducts.length < 2000 && selectedProducts.length < allProducts.length) {
  const remaining = allProducts.filter(p => !selectedProducts.includes(p));
  if (remaining.length === 0) break;
  selectedProducts.push(remaining[0]);
}

console.log(`📦 Selected ${selectedProducts.length} products with diverse pricing\n`);

// Generate SQL
let sqlContent = `-- Amazon Products (2000 products, $10 - $50,000)
-- Filtered from amazon_products_cleaned.csv
-- Real product names, prices, and images from Amazon

-- Delete existing products
DELETE FROM product;

-- Reset auto increment
ALTER TABLE product AUTO_INCREMENT = 1;

-- Insert products
INSERT INTO product (name, brand, category, price, image, productUrl, isActive, createdAt, updatedAt) VALUES
`;

const valueLines = selectedProducts.map(p => 
  `('${p.name}', '${p.brand}', '${p.category}', ${p.price}, '${p.image}', '${p.productUrl}', 1, NOW(), NOW())`
);

sqlContent += valueLines.join(',\n');
sqlContent += ';\n';

// Write SQL file
const outputPath = path.join(__dirname, 'backend/prisma/amazon_2k_10-50k.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf-8');

// Calculate statistics
const prices = selectedProducts.map(p => p.price);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

// Price distribution
const ranges = [
  { label: '$10 - $100', min: 10, max: 100, count: 0 },
  { label: '$100 - $500', min: 100, max: 500, count: 0 },
  { label: '$500 - $1,000', min: 500, max: 1000, count: 0 },
  { label: '$1,000 - $5,000', min: 1000, max: 5000, count: 0 },
  { label: '$5,000 - $15,000', min: 5000, max: 15000, count: 0 },
  { label: '$15,000 - $50,000', min: 15000, max: 50000, count: 0 }
];

prices.forEach(price => {
  for (const range of ranges) {
    if (price >= range.min && price < range.max) {
      range.count++;
      break;
    }
  }
});

console.log('═══════════════════════════════════════════════════');
console.log('📊 STATISTICS');
console.log('═══════════════════════════════════════════════════\n');

console.log(`   Products: ${selectedProducts.length}`);
console.log(`   Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
console.log(`   Average price: $${avgPrice.toFixed(2)}`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

console.log('\n📈 PRICE DISTRIBUTION:\n');
ranges.forEach(range => {
  const percentage = ((range.count / prices.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(range.count / 20));
  console.log(`   ${range.label.padEnd(20)} ${range.count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
});

console.log('\n✅ Created: backend/prisma/amazon_2k_10-50k.sql');
console.log('\n🚀 To import on VPS:');
console.log('   cd /var/www/greeting-message');
console.log('   mysql -u greeting_user -p\'Greeting@2024!Strong\' greeting_message < backend/prisma/amazon_2k_10-50k.sql');
