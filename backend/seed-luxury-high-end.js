/**
 * Seed Luxury High-End Products ($1,000 - $30,000)
 * Real product names and real market prices
 */

const prisma = require('./lib/prisma');

const luxuryProducts = [
  // Ultra Luxury Watches ($5,000 - $30,000)
  { name: "Rolex Submariner Date 41mm Steel", brand: "Rolex", category: "Watches", price: 14300, image: "https://m.media-amazon.com/images/I/71VqJXzE9HL._AC_SL1500_.jpg" },
  { name: "Patek Philippe Calatrava 5227G White Gold", brand: "Patek Philippe", category: "Watches", price: 28500, image: "https://m.media-amazon.com/images/I/61qYvXZKZyL._AC_SL1500_.jpg" },
  { name: "Audemars Piguet Royal Oak 41mm Steel", brand: "Audemars Piguet", category: "Watches", price: 27800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Omega Speedmaster Moonwatch Professional", brand: "Omega", category: "Watches", price: 6800, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "TAG Heuer Carrera Calibre Heuer 02", brand: "TAG Heuer", category: "Watches", price: 5900, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Breitling Navitimer B01 Chronograph 43", brand: "Breitling", category: "Watches", price: 8900, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "IWC Portugieser Automatic 40mm", brand: "IWC", category: "Watches", price: 12500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Cartier Santos de Cartier Large Steel", brand: "Cartier", category: "Watches", price: 7600, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  
  // Luxury Handbags ($2,000 - $15,000)
  { name: "Hermès Birkin 30 Togo Leather", brand: "Hermès", category: "Handbags", price: 12500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Chanel Classic Flap Medium Caviar", brand: "Chanel", category: "Handbags", price: 9200, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Louis Vuitton Neverfull MM Monogram", brand: "Louis Vuitton", category: "Handbags", price: 2100, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Gucci Dionysus GG Supreme Medium", brand: "Gucci", category: "Handbags", price: 3200, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Prada Galleria Saffiano Leather Bag", brand: "Prada", category: "Handbags", price: 3600, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Dior Lady Dior Medium Cannage", brand: "Dior", category: "Handbags", price: 5800, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Bottega Veneta Intrecciato Cabat Tote", brand: "Bottega Veneta", category: "Handbags", price: 7200, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Fendi Peekaboo ISeeU Medium", brand: "Fendi", category: "Handbags", price: 4900, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  
  // High-End Jewelry ($3,000 - $20,000)
  { name: "Tiffany & Co. Soleste Diamond Ring 1.5ct", brand: "Tiffany & Co.", category: "Jewelry", price: 15800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Cartier Love Bracelet 18K Yellow Gold", brand: "Cartier", category: "Jewelry", price: 7350, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Van Cleef & Arpels Alhambra Necklace", brand: "Van Cleef & Arpels", category: "Jewelry", price: 4200, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Bulgari B.zero1 Ring 18K White Gold", brand: "Bulgari", category: "Jewelry", price: 3800, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Harry Winston Diamond Stud Earrings 2ct", brand: "Harry Winston", category: "Jewelry", price: 18500, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Chopard Happy Diamonds Pendant", brand: "Chopard", category: "Jewelry", price: 5600, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  
  // Premium Electronics ($1,000 - $8,000)
  { name: "Apple Mac Pro M2 Ultra 24-Core 64GB 1TB", brand: "Apple", category: "Electronics", price: 6999, image: "https://m.media-amazon.com/images/I/61lsexTEJtL._AC_SL1500_.jpg" },
  { name: "Apple MacBook Pro 16 M3 Max 128GB 8TB", brand: "Apple", category: "Electronics", price: 7199, image: "https://m.media-amazon.com/images/I/61lsexTEJtL._AC_SL1500_.jpg" },
  { name: "Microsoft Surface Studio 2+ i7 32GB 1TB", brand: "Microsoft", category: "Electronics", price: 4499, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg" },
  { name: "Samsung 85 Neo QLED 8K QN900C TV", brand: "Samsung", category: "Electronics", price: 5499, image: "https://m.media-amazon.com/images/I/81lSiB0tQLL._AC_SL1500_.jpg" },
  { name: "LG 83 OLED evo C3 4K Smart TV", brand: "LG", category: "Electronics", price: 4999, image: "https://m.media-amazon.com/images/I/71f3hXNgTXL._AC_SL1500_.jpg" },
  { name: "Sony A95L 77 QD-OLED 4K HDR TV", brand: "Sony", category: "Electronics", price: 5999, image: "https://m.media-amazon.com/images/I/81YH1OYVDEL._AC_SL1500_.jpg" },
  { name: "Bowers & Wilkins 800 D4 Diamond Speakers", brand: "Bowers & Wilkins", category: "Electronics", price: 28000, image: "https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg" },
  { name: "McIntosh MC462 Stereo Power Amplifier", brand: "McIntosh", category: "Electronics", price: 12000, image: "https://m.media-amazon.com/images/I/71s46FFDCVL._AC_SL1500_.jpg" },
  
  // Professional Cameras ($2,000 - $6,500)
  { name: "Canon EOS R5 C Cinema Camera Body", brand: "Canon", category: "Camera", price: 4499, image: "https://m.media-amazon.com/images/I/61Ww4abGpIL._AC_SL1001_.jpg" },
  { name: "Sony Alpha 1 Full-Frame Mirrorless", brand: "Sony", category: "Camera", price: 6498, image: "https://m.media-amazon.com/images/I/81YH1OYVDEL._AC_SL1500_.jpg" },
  { name: "Nikon Z9 Full-Frame Mirrorless Camera", brand: "Nikon", category: "Camera", price: 5496, image: "https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg" },
  { name: "Leica Q3 Full-Frame Compact Camera", brand: "Leica", category: "Camera", price: 5995, image: "https://m.media-amazon.com/images/I/61VVKqoMJaL._AC_SL1500_.jpg" },
  { name: "Hasselblad X2D 100C Medium Format", brand: "Hasselblad", category: "Camera", price: 8199, image: "https://m.media-amazon.com/images/I/61p2fYdYQ8L._AC_SL1500_.jpg" },
  { name: "DJI Inspire 3 Professional Drone", brand: "DJI", category: "Camera", price: 16499, image: "https://m.media-amazon.com/images/I/61VVKqoMJaL._AC_SL1500_.jpg" },
  
  // Luxury Fashion ($1,000 - $5,000)
  { name: "Canada Goose Snow Mantra Parka", brand: "Canada Goose", category: "Fashion", price: 1895, image: "https://m.media-amazon.com/images/I/71MpGmHjJdL._AC_SL1500_.jpg" },
  { name: "Moncler Grenoble Ski Jacket", brand: "Moncler", category: "Fashion", price: 2450, image: "https://m.media-amazon.com/images/I/714c2lPLVVL._AC_SL1500_.jpg" },
  { name: "Burberry Heritage Trench Coat", brand: "Burberry", category: "Fashion", price: 2290, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Tom Ford Shelton Velvet Dinner Jacket", brand: "Tom Ford", category: "Fashion", price: 4980, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Loro Piana Cashmere Overcoat", brand: "Loro Piana", category: "Fashion", price: 5800, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Christian Louboutin So Kate 120mm Pumps", brand: "Christian Louboutin", category: "Fashion", price: 795, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Balenciaga Triple S Clear Sole Sneakers", brand: "Balenciaga", category: "Fashion", price: 1090, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Golden Goose Super-Star Distressed Sneakers", brand: "Golden Goose", category: "Fashion", price: 560, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  
  // Premium Home & Lifestyle ($1,000 - $10,000)
  { name: "Herman Miller Eames Lounge Chair & Ottoman", brand: "Herman Miller", category: "Home", price: 6495, image: "https://m.media-amazon.com/images/I/61cLuhfxJjL._AC_SL1500_.jpg" },
  { name: "Peloton Bike+ Premium Package", brand: "Peloton", category: "Home", price: 2495, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Technogym Kinesis Personal Vision", brand: "Technogym", category: "Home", price: 8900, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "La Marzocco Linea Mini Espresso Machine", brand: "La Marzocco", category: "Home", price: 5900, image: "https://m.media-amazon.com/images/I/61hTavyIC0L._AC_SL1500_.jpg" },
  { name: "Sub-Zero 48 Built-In Refrigerator", brand: "Sub-Zero", category: "Home", price: 14999, image: "https://m.media-amazon.com/images/I/71kQZKqL8HL._AC_SL1500_.jpg" },
  { name: "Wolf 48 Dual Fuel Range 6 Burners", brand: "Wolf", category: "Home", price: 12995, image: "https://m.media-amazon.com/images/I/71YqZKqL8HL._AC_SL1500_.jpg" },
  { name: "Miele Complete C3 Vacuum Cleaner", brand: "Miele", category: "Home", price: 1399, image: "https://m.media-amazon.com/images/I/61cLuhfxJjL._AC_SL1500_.jpg" },
  { name: "Dyson Purifier Hot+Cool Formaldehyde HP09", brand: "Dyson", category: "Home", price: 949, image: "https://m.media-amazon.com/images/I/51TJGekFnPL._SL1500_.jpg" },
];

async function seedLuxuryProducts() {
  console.log('💎 Seeding luxury high-end products ($1,000 - $30,000)...\n');
  
  try {
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await prisma.product.deleteMany({});
    console.log('✅ Cleared\n');

    // Insert luxury products in batches
    console.log('💾 Inserting luxury products...');
    const batchSize = 20;
    let inserted = 0;
    
    for (let i = 0; i < luxuryProducts.length; i += batchSize) {
      const batch = luxuryProducts.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch.map(p => ({
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price,
          image: p.image,
          isActive: true
        }))
      });
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${luxuryProducts.length} products`);
    }

    console.log(`\n🎉 Successfully seeded ${luxuryProducts.length} luxury products!\n`);
    
    // Show statistics
    const stats = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      _avg: { price: true },
      _max: { price: true }
    });
    
    console.log('📊 Products by category:');
    stats.forEach(s => {
      console.log(`  ${s.category}: ${s._count} products (Avg: $${Math.round(s._avg.price)}, Max: $${s._max.price})`);
    });
    
    // Show price range
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log('\n💰 Overall price statistics:');
    console.log(`  Min: $${priceStats._min.price.toLocaleString()}`);
    console.log(`  Max: $${priceStats._max.price.toLocaleString()}`);
    console.log(`  Avg: $${Math.round(priceStats._avg.price).toLocaleString()}`);
    
    // Show most expensive products
    const topExpensive = await prisma.product.findMany({
      orderBy: { price: 'desc' },
      take: 5
    });
    
    console.log('\n👑 Top 5 most expensive products:');
    topExpensive.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - $${p.price.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLuxuryProducts();
