/**
 * Seed 2000 Products from REAL APIs
 * Sources: DummyJSON, FakeStoreAPI, Platzi Fake Store API
 * All products have real images and data
 */

const prisma = require('./lib/prisma');
const https = require('https');

// Fetch from DummyJSON (100 products)
function fetchDummyJSON() {
  return new Promise((resolve, reject) => {
    https.get('https://dummyjson.com/products?limit=100', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.products.map(p => ({
            name: p.title,
            brand: p.brand || 'Generic',
            category: p.category,
            price: Math.round(p.price),
            image: p.thumbnail,
            productUrl: `https://dummyjson.com/products/${p.id}`,
            description: p.description
          })));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Fetch from FakeStoreAPI (20 products)
function fetchFakeStore() {
  return new Promise((resolve, reject) => {
    https.get('https://fakestoreapi.com/products', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.map(p => ({
            name: p.title,
            brand: p.category.split(' ')[0] || 'Generic',
            category: p.category,
            price: Math.round(p.price),
            image: p.image,
            productUrl: `https://fakestoreapi.com/products/${p.id}`,
            description: p.description
          })));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Fetch from Platzi Fake Store API (200 products)
function fetchPlatziStore() {
  return new Promise((resolve, reject) => {
    https.get('https://api.escuelajs.co/api/v1/products?offset=0&limit=200', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.map(p => ({
            name: p.title,
            brand: p.category?.name || 'Generic',
            category: p.category?.name || 'Miscellaneous',
            price: Math.round(p.price),
            image: p.images?.[0] || p.category?.image || 'https://via.placeholder.com/800',
            productUrl: `https://api.escuelajs.co/api/v1/products/${p.id}`,
            description: p.description
          })));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Generate variations to reach 2000 products
function generateVariations(baseProducts, targetCount) {
  const products = [];
  const editions = ['', 'Pro', 'Plus', 'Premium', 'Deluxe', 'Limited Edition', 'Special Edition', 'Ultra'];
  const years = ['2024', '2025'];
  const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Rose Gold', 'Space Gray'];
  
  let index = 0;
  while (products.length < targetCount) {
    const base = baseProducts[index % baseProducts.length];
    const edition = editions[Math.floor(Math.random() * editions.length)];
    const year = years[Math.floor(Math.random() * years.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Create variation name
    let variantName = base.name;
    if (edition) variantName += ` ${edition}`;
    if (Math.random() > 0.5) variantName += ` ${year}`;
    if (Math.random() > 0.7) variantName += ` ${color}`;
    
    // Price variation (±30%)
    const priceVariation = 0.7 + Math.random() * 0.6;
    const variantPrice = Math.round(base.price * priceVariation);
    
    products.push({
      name: variantName,
      brand: base.brand,
      category: base.category,
      price: variantPrice,
      image: base.image,
      productUrl: base.productUrl,
      isActive: true
    });
    
    index++;
  }
  
  return products;
}

async function seedProducts() {
  console.log('🌱 Fetching products from REAL APIs...\n');
  
  try {
    // Fetch from all APIs
    console.log('📡 Fetching from DummyJSON...');
    const dummyProducts = await fetchDummyJSON();
    console.log(`✅ Got ${dummyProducts.length} products from DummyJSON`);
    
    console.log('📡 Fetching from FakeStoreAPI...');
    const fakeStoreProducts = await fetchFakeStore();
    console.log(`✅ Got ${fakeStoreProducts.length} products from FakeStoreAPI`);
    
    console.log('📡 Fetching from Platzi Fake Store API...');
    const platziProducts = await fetchPlatziStore();
    console.log(`✅ Got ${platziProducts.length} products from Platzi API`);
    
    // Combine all base products
    const baseProducts = [...dummyProducts, ...fakeStoreProducts, ...platziProducts];
    console.log(`\n✅ Total base products: ${baseProducts.length}`);
    
    // Generate variations to reach 2000
    console.log('🔄 Generating variations to reach 2000 products...');
    const allProducts = generateVariations(baseProducts, 2000);
    console.log(`✅ Generated ${allProducts.length} products\n`);
    
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await prisma.product.deleteMany({});
    console.log('✅ Cleared existing products\n');
    
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
      _count: true
    });
    
    console.log('📊 Products by category:');
    stats.sort((a, b) => b._count - a._count).forEach(s => {
      console.log(`  ${s.category}: ${s._count} products`);
    });
    
    // Show price range
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log('\n💰 Price statistics:');
    console.log(`  Min: $${priceStats._min.price}`);
    console.log(`  Max: $${priceStats._max.price}`);
    console.log(`  Avg: $${Math.round(priceStats._avg.price)}`);
    
    // Show sample
    const sample = await prisma.product.findMany({ take: 5 });
    console.log('\n📦 Sample products:');
    sample.forEach(p => console.log(`  - ${p.name} ($${p.price}) - ${p.brand}`));
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
