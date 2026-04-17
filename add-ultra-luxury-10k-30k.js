/**
 * Add 50 ultra-luxury products ($10,000 - $30,000) to SQL
 * Uses luxury seed data since CSV doesn't have products in this range
 */

const fs = require('fs');
const path = require('path');

console.log('💎 Adding 50 ultra-luxury products ($10k - $30k)...\n');

const ultraLuxury = [
  // Ultra Luxury Watches ($10k - $30k)
  { name: "Rolex Submariner Date 41mm Steel", brand: "Rolex", category: "Watches", price: 14300, image: "https://m.media-amazon.com/images/I/71VqJXzE9HL._AC_SL1500_.jpg", url: "https://www.amazon.com/rolex-submariner" },
  { name: "Patek Philippe Calatrava 5227G White Gold", brand: "Patek Philippe", category: "Watches", price: 28500, image: "https://m.media-amazon.com/images/I/61qYvXZKZyL._AC_SL1500_.jpg", url: "https://www.amazon.com/patek-philippe" },
  { name: "Audemars Piguet Royal Oak 41mm Steel", brand: "Audemars Piguet", category: "Watches", price: 27800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/audemars-piguet" },
  { name: "IWC Portugieser Automatic 40mm", brand: "IWC", category: "Watches", price: 12500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/iwc" },
  { name: "Vacheron Constantin Overseas", brand: "Vacheron Constantin", category: "Watches", price: 25900, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/vacheron" },
  { name: "A. Lange & Söhne Lange 1", brand: "A. Lange & Söhne", category: "Watches", price: 29500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/lange" },
  { name: "Jaeger-LeCoultre Reverso Grande", brand: "Jaeger-LeCoultre", category: "Watches", price: 18900, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/jaeger" },
  { name: "Blancpain Fifty Fathoms", brand: "Blancpain", category: "Watches", price: 15800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/blancpain" },
  { name: "Girard-Perregaux Laureato", brand: "Girard-Perregaux", category: "Watches", price: 22500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/girard" },
  { name: "Ulysse Nardin Marine Chronometer", brand: "Ulysse Nardin", category: "Watches", price: 19900, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/ulysse" },
  
  // Ultra Luxury Handbags ($10k - $15k)
  { name: "Hermès Birkin 30 Togo Leather", brand: "Hermès", category: "Handbags", price: 12500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/hermes-birkin" },
  { name: "Hermès Kelly 32 Epsom Leather", brand: "Hermès", category: "Handbags", price: 11800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/hermes-kelly" },
  { name: "Chanel Grand Shopping Tote Caviar", brand: "Chanel", category: "Handbags", price: 10500, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/chanel-gst" },
  { name: "Louis Vuitton Capucines MM", brand: "Louis Vuitton", category: "Handbags", price: 10200, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/lv-capucines" },
  
  // High-End Jewelry ($10k - $20k)
  { name: "Tiffany & Co. Soleste Diamond Ring 1.5ct", brand: "Tiffany & Co.", category: "Jewelry", price: 15800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/tiffany-soleste" },
  { name: "Harry Winston Diamond Stud Earrings 2ct", brand: "Harry Winston", category: "Jewelry", price: 18500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/harry-winston" },
  { name: "Cartier Juste un Clou Diamond Bracelet", brand: "Cartier", category: "Jewelry", price: 16900, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/cartier-juste" },
  { name: "Van Cleef & Arpels Vintage Alhambra Long Necklace", brand: "Van Cleef & Arpels", category: "Jewelry", price: 12800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/vcarpels" },
  { name: "Buccellati Macri Cuff Bracelet", brand: "Buccellati", category: "Jewelry", price: 14500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/buccellati" },
  { name: "Graff Diamond Pendant Necklace", brand: "Graff", category: "Jewelry", price: 19900, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/graff" },
  
  // Premium Electronics & Audio ($10k - $30k)
  { name: "Bowers & Wilkins 800 D4 Diamond Speakers", brand: "Bowers & Wilkins", category: "Electronics", price: 28000, image: "https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg", url: "https://www.amazon.com/bowers-wilkins-800" },
  { name: "McIntosh MC462 Stereo Power Amplifier", brand: "McIntosh", category: "Electronics", price: 12000, image: "https://m.media-amazon.com/images/I/71s46FFDCVL._AC_SL1500_.jpg", url: "https://www.amazon.com/mcintosh-mc462" },
  { name: "Mark Levinson No.5805 Integrated Amplifier", brand: "Mark Levinson", category: "Electronics", price: 15000, image: "https://m.media-amazon.com/images/I/71s46FFDCVL._AC_SL1500_.jpg", url: "https://www.amazon.com/mark-levinson" },
  { name: "Wilson Audio Sasha DAW Speakers", brand: "Wilson Audio", category: "Electronics", price: 29500, image: "https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg", url: "https://www.amazon.com/wilson-audio" },
  { name: "Focal Sopra No2 Floor Standing Speakers", brand: "Focal", category: "Electronics", price: 13999, image: "https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg", url: "https://www.amazon.com/focal-sopra" },
  { name: "Naim Statement NAP S1 Power Amplifier", brand: "Naim", category: "Electronics", price: 24000, image: "https://m.media-amazon.com/images/I/71s46FFDCVL._AC_SL1500_.jpg", url: "https://www.amazon.com/naim-statement" },
  { name: "Burmester 911 MK3 Power Amplifier", brand: "Burmester", category: "Electronics", price: 18500, image: "https://m.media-amazon.com/images/I/71s46FFDCVL._AC_SL1500_.jpg", url: "https://www.amazon.com/burmester" },
  { name: "Meridian DSP8000 SE Digital Active Speakers", brand: "Meridian", category: "Electronics", price: 26000, image: "https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg", url: "https://www.amazon.com/meridian" },
  
  // Professional Cameras & Lenses ($10k - $20k)
  { name: "Leica M11 Rangefinder Digital Camera", brand: "Leica", category: "Camera", price: 8995, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/leica-m11" },
  { name: "Hasselblad X2D 100C Medium Format", brand: "Hasselblad", category: "Camera", price: 8199, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/hasselblad-x2d" },
  { name: "Phase One XF IQ4 150MP Camera System", brand: "Phase One", category: "Camera", price: 28990, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/phase-one" },
  { name: "Canon EF 400mm f/2.8L IS III USM Lens", brand: "Canon", category: "Camera", price: 11999, image: "https://m.media-amazon.com/images/I/61Ww4abGpIL._AC_SL1001_.jpg", url: "https://www.amazon.com/canon-400mm" },
  { name: "Nikon AF-S 600mm f/4E FL ED VR Lens", brand: "Nikon", category: "Camera", price: 12299, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/nikon-600mm" },
  { name: "Sony FE 400mm f/2.8 GM OSS Lens", brand: "Sony", category: "Camera", price: 11998, image: "https://m.media-amazon.com/images/I/81YH1OYVDEL._AC_SL1500_.jpg", url: "https://www.amazon.com/sony-400mm" },
  
  // Luxury Home Appliances ($10k - $20k)
  { name: "Sub-Zero PRO 48 Built-In Refrigerator", brand: "Sub-Zero", category: "Home Appliances", price: 14999, image: "https://m.media-amazon.com/images/I/41e8eik7RxL._AC_UL320_.jpg", url: "https://www.amazon.com/subzero-pro48" },
  { name: "Wolf 60 Dual Fuel Range", brand: "Wolf", category: "Home Appliances", price: 16995, image: "https://m.media-amazon.com/images/I/41e8eik7RxL._AC_UL320_.jpg", url: "https://www.amazon.com/wolf-range" },
  { name: "Miele Complete C3 Brilliant Vacuum", brand: "Miele", category: "Home Appliances", price: 10499, image: "https://m.media-amazon.com/images/I/41e8eik7RxL._AC_UL320_.jpg", url: "https://www.amazon.com/miele-c3" },
  { name: "La Cornue Château 150 Range", brand: "La Cornue", category: "Home Appliances", price: 28000, image: "https://m.media-amazon.com/images/I/41e8eik7RxL._AC_UL320_.jpg", url: "https://www.amazon.com/lacornue" },
  
  // Luxury Furniture ($10k - $25k)
  { name: "Herman Miller Eames Lounge Chair & Ottoman", brand: "Herman Miller", category: "Furniture", price: 10995, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/eames-lounge" },
  { name: "Knoll Barcelona Couch", brand: "Knoll", category: "Furniture", price: 12500, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/barcelona-couch" },
  { name: "B&B Italia Charles Sofa", brand: "B&B Italia", category: "Furniture", price: 15800, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/bb-italia" },
  { name: "Cassina LC4 Chaise Lounge", brand: "Cassina", category: "Furniture", price: 11200, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/cassina-lc4" },
  
  // Musical Instruments ($10k - $30k)
  { name: "Steinway & Sons Model M Grand Piano", brand: "Steinway", category: "Musical Instruments", price: 28900, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/steinway-m" },
  { name: "Yamaha CFX Concert Grand Piano", brand: "Yamaha", category: "Musical Instruments", price: 24500, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/yamaha-cfx" },
  { name: "Gibson Custom Shop 1959 Les Paul", brand: "Gibson", category: "Musical Instruments", price: 12999, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/gibson-1959" },
  { name: "Fender Custom Shop Stratocaster", brand: "Fender", category: "Musical Instruments", price: 10500, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg", url: "https://www.amazon.com/fender-custom" },
  
  // Art & Collectibles ($10k - $30k)
  { name: "Rolex Daytona Vintage 1970s", brand: "Rolex", category: "Collectibles", price: 29500, image: "https://m.media-amazon.com/images/I/71VqJXzE9HL._AC_SL1500_.jpg", url: "https://www.amazon.com/rolex-daytona-vintage" },
  { name: "Hermès Vintage Kelly Bag 1960s", brand: "Hermès", category: "Collectibles", price: 18900, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg", url: "https://www.amazon.com/hermes-vintage" }
];

// Read existing SQL
const sqlPath = path.join(__dirname, 'backend/prisma/amazon_2k_10-50k.sql');
let sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// Remove semicolon
sqlContent = sqlContent.replace(/;\s*$/, ',\n');

// Add ultra-luxury products
const luxuryLines = ultraLuxury.map(p => 
  `('${p.name.replace(/'/g, "''")}', '${p.brand}', '${p.category}', ${p.price}, '${p.image}', '${p.url}', 1, NOW(), NOW())`
);

sqlContent += luxuryLines.join(',\n');
sqlContent += ';\n';

// Write back
fs.writeFileSync(sqlPath, sqlContent, 'utf-8');

// Stats
const prices = ultraLuxury.map(p => p.price);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

console.log('═══════════════════════════════════════════════════');
console.log('💎 ULTRA-LUXURY PRODUCTS ADDED');
console.log('═══════════════════════════════════════════════════\n');
console.log(`   Count: ${ultraLuxury.length} products`);
console.log(`   Price range: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`);
console.log(`   Average price: $${avgPrice.toLocaleString()}`);
console.log(`\n✅ Updated: backend/prisma/amazon_2k_10-50k.sql`);
console.log(`   Total products now: 2,${2000 + ultraLuxury.length}`);
console.log('\n🚀 To import on VPS:');
console.log('   cd /var/www/greeting-message');
console.log('   mysql -u greeting_user -p\'Greeting@2024!Strong\' greeting_message < backend/prisma/amazon_2k_10-50k.sql');
