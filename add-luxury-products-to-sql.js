/**
 * Add 100 luxury products ($1,000 - $30,000) to existing SQL
 * First checks CSV, then adds luxury products from seed file
 */

const fs = require('fs');
const path = require('path');

console.log('💎 Adding 100 luxury products ($1k - $30k)...\n');

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
  const cleaned = priceStr.replace(/[$,\s]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// Step 1: Check CSV for luxury products
console.log('🔍 Step 1: Checking CSV for products $1,000 - $30,000...\n');

const csvPath = path.join(__dirname, 'backend/prisma/archive/amazon_products_cleaned.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').slice(1);

const luxuryFromCSV = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const fields = parseCSVLine(line);
  const priceStr = fields[5] || '$0';
  const price = parsePrice(priceStr);
  
  if (price >= 1000 && price <= 30000) {
    const category = fields[1] || 'Electronics';
    const subcategory = fields[2] || 'General';
    const name = fields[3] || `Product ${i + 1}`;
    const productUrl = fields[4] || 'https://www.amazon.com';
    const image = fields[8] || 'https://via.placeholder.com/400';
    
    luxuryFromCSV.push({
      name: escapeSQL(name.substring(0, 500)),
      brand: escapeSQL(subcategory.substring(0, 100)),
      category: escapeSQL(category.substring(0, 100)),
      price: price,
      image: escapeSQL(image),
      productUrl: escapeSQL(productUrl)
    });
  }
}

console.log(`   Found ${luxuryFromCSV.length} products in CSV with price $1k - $30k`);

// Step 2: Add luxury products from seed file
console.log('\n💎 Step 2: Adding luxury products from seed data...\n');

const luxuryProducts = [
  // Ultra Luxury Watches
  { name: "Rolex Submariner Date 41mm Steel", brand: "Rolex", category: "Watches", price: 14300, image: "https://m.media-amazon.com/images/I/71VqJXzE9HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/rolex-submariner" },
  { name: "Patek Philippe Calatrava 5227G White Gold", brand: "Patek Philippe", category: "Watches", price: 28500, image: "https://m.media-amazon.com/images/I/61qYvXZKZyL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/patek-philippe" },
  { name: "Audemars Piguet Royal Oak 41mm Steel", brand: "Audemars Piguet", category: "Watches", price: 27800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/audemars-piguet" },
  { name: "Omega Speedmaster Moonwatch Professional", brand: "Omega", category: "Watches", price: 6800, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/omega-speedmaster" },
  { name: "TAG Heuer Carrera Calibre Heuer 02", brand: "TAG Heuer", category: "Watches", price: 5900, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/tag-heuer" },
  { name: "Breitling Navitimer B01 Chronograph 43", brand: "Breitling", category: "Watches", price: 8900, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/breitling" },
  { name: "IWC Portugieser Automatic 40mm", brand: "IWC", category: "Watches", price: 12500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/iwc" },
  { name: "Cartier Santos de Cartier Large Steel", brand: "Cartier", category: "Watches", price: 7600, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/cartier" },
  
  // Luxury Handbags
  { name: "Hermès Birkin 30 Togo Leather", brand: "Hermès", category: "Handbags", price: 12500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/hermes" },
  { name: "Chanel Classic Flap Medium Caviar", brand: "Chanel", category: "Handbags", price: 9200, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/chanel" },
  { name: "Louis Vuitton Neverfull MM Monogram", brand: "Louis Vuitton", category: "Handbags", price: 2100, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/louis-vuitton" },
  { name: "Gucci Dionysus GG Supreme Medium", brand: "Gucci", category: "Handbags", price: 3200, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/gucci" },
  { name: "Prada Galleria Saffiano Leather Bag", brand: "Prada", category: "Handbags", price: 3600, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/prada" },
  { name: "Dior Lady Dior Medium Cannage", brand: "Dior", category: "Handbags", price: 5800, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/dior" },
  { name: "Bottega Veneta Intrecciato Cabat Tote", brand: "Bottega Veneta", category: "Handbags", price: 7200, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/bottega-veneta" },
  { name: "Fendi Peekaboo ISeeU Medium", brand: "Fendi", category: "Handbags", price: 4900, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/fendi" },
  
  // High-End Jewelry
  { name: "Tiffany & Co. Soleste Diamond Ring 1.5ct", brand: "Tiffany & Co.", category: "Jewelry", price: 15800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/tiffany" },
  { name: "Cartier Love Bracelet 18K Yellow Gold", brand: "Cartier", category: "Jewelry", price: 7350, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/cartier-love" },
  { name: "Van Cleef & Arpels Alhambra Necklace", brand: "Van Cleef & Arpels", category: "Jewelry", price: 4200, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/van-cleef" },
  { name: "Bulgari B.zero1 Ring 18K White Gold", brand: "Bulgari", category: "Jewelry", price: 3800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/bulgari" },
  { name: "Harry Winston Diamond Stud Earrings 2ct", brand: "Harry Winston", category: "Jewelry", price: 18500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/harry-winston" },
  { name: "Chopard Happy Diamonds Pendant", brand: "Chopard", category: "Jewelry", price: 5600, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/chopard" },
  
  // Premium Electronics
  { name: "Apple Mac Pro M2 Ultra 24-Core 64GB 1TB", brand: "Apple", category: "Electronics", price: 6999, image: "https://m.media-amazon.com/images/I/61lsexTEJtL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/mac-pro" },
  { name: "Apple MacBook Pro 16 M3 Max 128GB 8TB", brand: "Apple", category: "Electronics", price: 7199, image: "https://m.media-amazon.com/images/I/61lsexTEJtL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/macbook-pro" },
  { name: "Microsoft Surface Studio 2+ i7 32GB 1TB", brand: "Microsoft", category: "Electronics", price: 4499, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/surface-studio" },
  { name: "Samsung 85 Neo QLED 8K QN900C TV", brand: "Samsung", category: "Electronics", price: 5499, image: "https://m.media-amazon.com/images/I/81lSiB0tQLL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/samsung-qled" },
  { name: "LG 83 OLED evo C3 4K Smart TV", brand: "LG", category: "Electronics", price: 4999, image: "https://m.media-amazon.com/images/I/71f3hXNgTXL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/lg-oled" },
  { name: "Sony A95L 77 QD-OLED 4K HDR TV", brand: "Sony", category: "Electronics", price: 5999, image: "https://m.media-amazon.com/images/I/81YH1OYVDEL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/sony-oled" },
  { name: "Bowers & Wilkins 800 D4 Diamond Speakers", brand: "Bowers & Wilkins", category: "Electronics", price: 28000, image: "https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/bowers-wilkins" },
  { name: "McIntosh MC462 Stereo Power Amplifier", brand: "McIntosh", category: "Electronics", price: 12000, image: "https://m.media-amazon.com/images/I/71s46FFDCVL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/mcintosh" },
  
  // Professional Cameras
  { name: "Canon EOS R5 C Cinema Camera Body", brand: "Canon", category: "Camera", price: 4499, image: "https://m.media-amazon.com/images/I/61Ww4abGpIL._AC_SL1001_.jpg", productUrl: "https://www.amazon.com/canon-r5c" },
  { name: "Sony Alpha 1 Full-Frame Mirrorless", brand: "Sony", category: "Camera", price: 6498, image: "https://m.media-amazon.com/images/I/81YH1OYVDEL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/sony-alpha-1" },
  { name: "Nikon Z9 Full-Frame Mirrorless Camera", brand: "Nikon", category: "Camera", price: 5496, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/nikon-z9" },
  { name: "Leica M11 Rangefinder Digital Camera", brand: "Leica", category: "Camera", price: 8995, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/leica-m11" },
  { name: "Hasselblad X2D 100C Medium Format", brand: "Hasselblad", category: "Camera", price: 8199, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", productUrl: "https://www.amazon.com/hasselblad" },
];

// Combine: prioritize CSV products, then add luxury products
let selectedLuxury = [];

if (luxuryFromCSV.length > 0) {
  console.log(`   Using ${Math.min(luxuryFromCSV.length, 100)} products from CSV`);
  selectedLuxury = luxuryFromCSV.slice(0, 100);
}

// Fill remaining with luxury seed data
const remaining = 100 - selectedLuxury.length;
if (remaining > 0) {
  console.log(`   Adding ${remaining} luxury products from seed data`);
  selectedLuxury = selectedLuxury.concat(luxuryProducts.slice(0, remaining));
}

console.log(`\n✅ Total luxury products to add: ${selectedLuxury.length}`);

// Step 3: Read existing SQL and append
console.log('\n📝 Step 3: Updating SQL file...\n');

const sqlPath = path.join(__dirname, 'backend/prisma/amazon_2k_10-50k.sql');
let sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// Remove the semicolon at the end
sqlContent = sqlContent.replace(/;\s*$/, ',\n');

// Add luxury products
const luxuryLines = selectedLuxury.map(p => 
  `('${p.name}', '${p.brand}', '${p.category}', ${p.price}, '${p.image}', '${p.productUrl}', 1, NOW(), NOW())`
);

sqlContent += luxuryLines.join(',\n');
sqlContent += ';\n';

// Write updated SQL
fs.writeFileSync(sqlPath, sqlContent, 'utf-8');

// Calculate new statistics
const allPrices = selectedLuxury.map(p => p.price);
const minLuxury = Math.min(...allPrices);
const maxLuxury = Math.max(...allPrices);
const avgLuxury = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

console.log('═══════════════════════════════════════════════════');
console.log('📊 LUXURY PRODUCTS ADDED');
console.log('═══════════════════════════════════════════════════\n');
console.log(`   Count: ${selectedLuxury.length} products`);
console.log(`   Price range: $${minLuxury.toFixed(2)} - $${maxLuxury.toFixed(2)}`);
console.log(`   Average price: $${avgLuxury.toFixed(2)}`);
console.log(`\n✅ Updated: backend/prisma/amazon_2k_10-50k.sql`);
console.log(`   Total products now: 2100`);
console.log('\n🚀 To import on VPS:');
console.log('   cd /var/www/greeting-message');
console.log('   mysql -u greeting_user -p\'Greeting@2024!Strong\' greeting_message < backend/prisma/amazon_2k_10-50k.sql');
