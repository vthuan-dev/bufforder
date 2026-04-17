/**
 * Check price range in SQL file
 */

const fs = require('fs');
const path = require('path');

console.log('💰 CHECKING PRICE RANGE IN SQL FILE...\n');

// Read SQL file
const sqlPath = path.join(__dirname, 'backend/prisma/amazon_2k_real_prices.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// Extract all prices using regex
const priceRegex = /,\s*(\d+\.?\d*)\s*,\s*'https:\/\/m\.media-amazon/g;
const prices = [];
let match;

while ((match = priceRegex.exec(sqlContent)) !== null) {
  const price = parseFloat(match[1]);
  if (!isNaN(price)) {
    prices.push(price);
  }
}

console.log(`📊 Found ${prices.length} products\n`);

if (prices.length === 0) {
  console.log('❌ No prices found in SQL file');
  process.exit(1);
}

// Calculate statistics
prices.sort((a, b) => a - b);

const minPrice = prices[0];
const maxPrice = prices[prices.length - 1];
const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
const medianPrice = prices[Math.floor(prices.length / 2)];

// Price distribution
const ranges = [
  { label: '$0 - $50', min: 0, max: 50, count: 0 },
  { label: '$50 - $100', min: 50, max: 100, count: 0 },
  { label: '$100 - $200', min: 100, max: 200, count: 0 },
  { label: '$200 - $500', min: 200, max: 500, count: 0 },
  { label: '$500 - $1,000', min: 500, max: 1000, count: 0 },
  { label: '$1,000 - $2,000', min: 1000, max: 2000, count: 0 },
  { label: '$2,000 - $5,000', min: 2000, max: 5000, count: 0 },
  { label: '$5,000+', min: 5000, max: Infinity, count: 0 }
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
console.log('📊 PRICE STATISTICS');
console.log('═══════════════════════════════════════════════════\n');

console.log(`   Minimum price:  $${minPrice.toFixed(2)}`);
console.log(`   Maximum price:  $${maxPrice.toFixed(2)}`);
console.log(`   Average price:  $${avgPrice.toFixed(2)}`);
console.log(`   Median price:   $${medianPrice.toFixed(2)}`);

console.log('\n═══════════════════════════════════════════════════');
console.log('📈 PRICE DISTRIBUTION');
console.log('═══════════════════════════════════════════════════\n');

ranges.forEach(range => {
  const percentage = ((range.count / prices.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(range.count / 20));
  console.log(`   ${range.label.padEnd(20)} ${range.count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
});

console.log('\n═══════════════════════════════════════════════════');
console.log('🔝 TOP 10 MOST EXPENSIVE PRODUCTS');
console.log('═══════════════════════════════════════════════════\n');

const top10 = prices.slice(-10).reverse();
top10.forEach((price, i) => {
  console.log(`   ${(i + 1).toString().padStart(2)}. $${price.toFixed(2)}`);
});

console.log('\n═══════════════════════════════════════════════════');
console.log('🔻 TOP 10 CHEAPEST PRODUCTS');
console.log('═══════════════════════════════════════════════════\n');

const bottom10 = prices.slice(0, 10);
bottom10.forEach((price, i) => {
  console.log(`   ${(i + 1).toString().padStart(2)}. $${price.toFixed(2)}`);
});

console.log('\n═══════════════════════════════════════════════════\n');
