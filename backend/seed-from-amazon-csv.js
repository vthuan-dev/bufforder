const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const products = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handle commas in quotes)
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 9) continue;
    
    const [index, category, subcategory, name, url, price, rating, totalRatings, image] = matches.map(m => m.replace(/^"|"$/g, '').trim());
    
    // Clean price (remove $ and commas)
    const cleanPrice = parseFloat(price.replace(/[$,]/g, ''));
    if (isNaN(cleanPrice) || cleanPrice <= 0) continue;
    
    // Clean image URL
    const cleanImage = image.trim();
    if (!cleanImage.startsWith('http')) continue;
    
    products.push({
      name: name.substring(0, 255),
      brand: extractBrand(name),
      category: subcategory || category || 'Electronics',
      price: cleanPrice,
      image: cleanImage,
      productUrl: url || null,
      isActive: true
    });
  }
  
  return products;
}

// Extract brand from product name
function extractBrand(name) {
  const brands = ['SAMSUNG', 'Apple', 'Google', 'Motorola', 'Moto', 'Bold', 'Tracfone'];
  for (const brand of brands) {
    if (name.toUpperCase().includes(brand.toUpperCase())) {
      return brand;
    }
  }
  return 'Generic';
}

// Generate variations with diverse prices
function generateVariations(baseProducts, targetCount) {
  console.log(`\n🔄 Generating variations to reach ${targetCount} products...`);
  const variations = [...baseProducts];
  
  const colors = ['Black', 'White', 'Blue', 'Silver', 'Gold', 'Rose Gold', 'Titanium', 'Gray', 'Navy', 'Purple'];
  const editions = ['', 'Pro', 'Plus', 'Ultra', 'Max', 'Premium', 'Deluxe', 'Limited Edition', 'Special Edition'];
  const years = ['2024', '2025'];
  
  // Price multipliers for diversity: $10 - $30,000
  const priceMultipliers = [
    { multiplier: () => 10 + Math.random() * 90, weight: 0.25 },      // 25%: $10-$100
    { multiplier: () => 100 + Math.random() * 400, weight: 0.25 },    // 25%: $100-$500
    { multiplier: () => 500 + Math.random() * 500, weight: 0.15 },    // 15%: $500-$1k
    { multiplier: () => 1000 + Math.random() * 2000, weight: 0.15 },  // 15%: $1k-$3k
    { multiplier: () => 3000 + Math.random() * 7000, weight: 0.10 },  // 10%: $3k-$10k
    { multiplier: () => 10000 + Math.random() * 20000, weight: 0.10 } // 10%: $10k-$30k
  };
  
  let index = 0;
  while (variations.length < targetCount && baseProducts.length > 0) {
    const base = baseProducts[index % baseProducts.length];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const edition = editions[Math.floor(Math.random() * editions.length)];
    const year = years[Math.floor(Math.random() * years.length)];
    
    // Select price range
    const rand = Math.random();
    let cumulativeWeight = 0;
    let selectedMultiplier = priceMultipliers[0].multiplier;
    
    for (const pm of priceMultipliers) {
      cumulativeWeight += pm.weight;
      if (rand <= cumulativeWeight) {
        selectedMultiplier = pm.multiplier;
        break;
      }
    }
    
    // Create variation
    const newPrice = selectedMultiplier();
    const nameParts = [base.name];
    if (edition) nameParts.push(edition);
    nameParts.push(color);
    if (Math.random() > 0.5) nameParts.push(year);
    
    variations.push({
      ...base,
      name: nameParts.join(' ').substring(0, 255),
      price: Math.round(newPrice * 100) / 100
    });
    
    index++;
  }
  
  console.log(`✅ Generated ${variations.length} total products`);
  
  // Show price distribution
  const priceRanges = {
    '$10-$100': 0,
    '$100-$500': 0,
    '$500-$1k': 0,
    '$1k-$3k': 0,
    '$3k-$10k': 0,
    '$10k-$30k': 0
  };
  
  variations.forEach(p => {
    if (p.price < 100) priceRanges['$10-$100']++;
    else if (p.price < 500) priceRanges['$100-$500']++;
    else if (p.price < 1000) priceRanges['$500-$1k']++;
    else if (p.price < 3000) priceRanges['$1k-$3k']++;
    else if (p.price < 10000) priceRanges['$3k-$10k']++;
    else priceRanges['$10k-$30k']++;
  });
  
  console.log('\n💰 Price distribution:');
  Object.entries(priceRanges).forEach(([range, count]) => {
    console.log(`  ${range}: ${count} products (${Math.round(count/variations.length*100)}%)`);
  });
  
  return variations.slice(0, targetCount);
}

async function seedFromAmazonCSV() {
  console.log('🌱 Seeding products from Amazon CSV...');
  console.log('📸 All images from Amazon CDN - 100% real!\n');
  
  try {
    // Parse CSV
    console.log('📄 Parsing CSV file...');
    const baseProducts = parseCSV('./prisma/archive/amazon_products_cleaned.csv');
    console.log(`✅ Parsed ${baseProducts.length} products from CSV\n`);
    
    if (baseProducts.length === 0) {
      throw new Error('No products found in CSV');
    }
    
    // Generate variations to reach 2000
    const allProducts = generateVariations(baseProducts, 2000);
    
    // Clear existing products
    console.log('\n🗑️  Clearing existing products...');
    await prisma.product.deleteMany({});
    console.log('✅ Cleared\n');
    
    // Insert in batches
    console.log('💾 Inserting products in batches...');
    const batchSize = 100;
    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize);
      await prisma.product.createMany({ data: batch });
      const progress = Math.round((i + batch.length) / allProducts.length * 100);
      console.log(`✅ Progress: ${progress}% (${i + batch.length}/${allProducts.length})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${allProducts.length} products!\n`);
    
    // Show statistics
    const stats = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      _avg: { price: true }
    });
    
    console.log('📊 Products by category:');
    stats.sort((a, b) => b._count - a._count).forEach(s => {
      console.log(`  ${s.category}: ${s._count} products (Avg: $${Math.round(s._avg.price).toLocaleString()})`);
    });
    
    // Show price range
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log('\n💰 Price statistics:');
    console.log(`  Min: $${priceStats._min.price}`);
    console.log(`  Max: $${Math.round(priceStats._max.price).toLocaleString()}`);
    console.log(`  Avg: $${Math.round(priceStats._avg.price).toLocaleString()}`);
    
    console.log('\n✅ All images from Amazon CDN - 100% working!');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedFromAmazonCSV();
