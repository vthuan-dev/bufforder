/**
 * Seed 2000 Real Products from DummyJSON API
 * Uses real product data with working images
 */

const prisma = require('./lib/prisma');
const https = require('https');

// Fetch products from DummyJSON API
function fetchProducts() {
  return new Promise((resolve, reject) => {
    https.get('https://dummyjson.com/products?limit=100', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.products);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Generate variations of base products
function generateVariations(baseProducts, targetCount) {
  const products = [];
  const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Pink', 'Purple', 'Gray'];
  const editions = ['Standard', 'Pro', 'Plus', 'Premium', 'Deluxe', 'Limited', 'Special', 'Ultimate'];
  const years = ['2024', '2025'];
  
  let index = 0;
  while (products.length < targetCount) {
    const baseProduct = baseProducts[index % baseProducts.length];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const edition = editions[Math.floor(Math.random() * editions.length)];
    const year = years[Math.floor(Math.random() * years.length)];
    
    // Create variation
    const variation = {
      name: `${baseProduct.brand} ${baseProduct.title} ${edition} ${year}`,
      brand: baseProduct.brand,
      category: baseProduct.category,
      price: Math.round(baseProduct.price * (0.8 + Math.random() * 0.4)), // ±20% price variation
      image: baseProduct.thumbnail || baseProduct.images[0],
      productUrl: `https://example.com/products/${baseProduct.id}-${index}`
    };
    
    products.push(variation);
    index++;
  }
  
  return products;
}

async function seedProducts() {
  console.log('🌱 Fetching real products from DummyJSON API...');
  
  try {
    // Fetch base products from API
    const baseProducts = await fetchProducts();
    console.log(`✅ Fetched ${baseProducts.length} base products`);
    
    // Generate 2000 variations
    console.log('🔄 Generating 2000 product variations...');
    const allProducts = generateVariations(baseProducts, 2000);
    console.log(`✅ Generated ${allProducts.length} products`);
    
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await prisma.product.deleteMany({});
    console.log('✅ Cleared existing products');
    
    // Insert in batches
    console.log('💾 Inserting products in batches...');
    const batchSize = 100;
    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch.map(p => ({
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price,
          image: p.image,
          productUrl: p.productUrl,
          isActive: true
        }))
      });
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allProducts.length / batchSize)}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${allProducts.length} products!`);
    
    // Show sample
    const sample = await prisma.product.findMany({ take: 5 });
    console.log('\n📦 Sample products:');
    sample.forEach(p => console.log(`  - ${p.name} ($${p.price})`));
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
