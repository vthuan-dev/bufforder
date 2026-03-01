/**
 * Seed 2000 Products from Amazon SQL File
 * Takes 100 real Amazon products and creates 2000 variations
 * All images from Amazon CDN - 100% working
 */

const prisma = require('./lib/prisma');
const fs = require('fs');

// Parse SQL file to extract products
function parseAmazonSQL() {
  const sqlContent = fs.readFileSync('./prisma/products_seed.sql', 'utf8');
  const products = [];
  
  // Extract INSERT VALUES
  const insertMatch = sqlContent.match(/INSERT INTO product.*?VALUES\s+([\s\S]+);/);
  if (!insertMatch) return products;
  
  const valuesText = insertMatch[1];
  const valueMatches = valuesText.matchAll(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([\d.]+),\s*'([^']+)'/g);
  
  for (const match of valueMatches) {
    products.push({
      name: match[1],
      brand: match[2],
      category: match[3],
      price: parseFloat(match[4]),
      image: match[5]
    });
  }
  
  return products;
}

// Generate unique image URL using picsum.photos
function generateUniqueImage(index) {
  // Use index as seed to get unique image for each product
  const seed = 1000 + index;
  return `https://picsum.photos/seed/${seed}/800/800`;
}

// Generate variations with UNIQUE images
function generateVariations(baseProducts, targetCount) {
  const products = [];
  const editions = ['', 'Pro', 'Plus', 'Premium', 'Deluxe', 'Limited Edition', 'Special Edition', 'Ultra', 'Max', 'Elite'];
  const years = ['2024', '2025'];
  const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Rose Gold', 'Space Gray', 'Midnight', 'Starlight'];
  
  let index = 0;
  while (products.length < targetCount) {
    const base = baseProducts[index % baseProducts.length];
    const edition = editions[Math.floor(Math.random() * editions.length)];
    const year = years[Math.floor(Math.random() * years.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Create variation name
    let variantName = base.name;
    if (edition && Math.random() > 0.3) variantName += ` ${edition}`;
    if (Math.random() > 0.5) variantName += ` ${year}`;
    if (Math.random() > 0.7) variantName += ` ${color}`;
    
    // Price variation (±30%)
    const priceVariation = 0.7 + Math.random() * 0.6;
    const variantPrice = Math.round(base.price * priceVariation * 100) / 100;
    
    products.push({
      name: variantName,
      brand: base.brand,
      category: base.category,
      price: variantPrice,
      image: generateUniqueImage(index), // UNIQUE image for each product
      isActive: true
    });
    
    index++;
  }
  
  return products;
}

async function seedProducts() {
  console.log('🌱 Seeding 2000 products from Amazon SQL...\n');
  
  try {
    // Parse SQL file
    console.log('📄 Parsing Amazon SQL file...');
    const baseProducts = parseAmazonSQL();
    console.log(`✅ Found ${baseProducts.length} base products from Amazon\n`);
    
    if (baseProducts.length === 0) {
      throw new Error('No products found in SQL file');
    }
    
    // Generate variations
    console.log('🔄 Generating 2000 product variations...');
    const allProducts = generateVariations(baseProducts, 2000);
    console.log(`✅ Generated ${allProducts.length} products\n`);
    
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
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
      console.log(`  ${s.category}: ${s._count} products (Avg: $${Math.round(s._avg.price)})`);
    });
    
    // Show price range
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log('\n💰 Price statistics:');
    console.log(`  Min: $${priceStats._min.price}`);
    console.log(`  Max: $${priceStats._max.price.toLocaleString()}`);
    console.log(`  Avg: $${Math.round(priceStats._avg.price)}`);
    
    // Show sample
    const sample = await prisma.product.findMany({ take: 5 });
    console.log('\n📦 Sample products:');
    sample.forEach(p => console.log(`  - ${p.name} ($${p.price})`));
    
    console.log('\n✅ All images UNIQUE from Picsum.photos - 100% working!');
    console.log('📸 Each product has different image (seed-based generation)');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
