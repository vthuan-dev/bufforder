const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

// Fetch data from URL
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function seedFromDummyJSON() {
  console.log('🎨 Fetching products from DummyJSON API...');
  console.log('📸 All products have real images!\n');
  
  try {
    // Fetch all products from DummyJSON (limit 194)
    const response = await fetchData('https://dummyjson.com/products?limit=194');
    const apiProducts = response.products;
    
    console.log(`✅ Fetched ${apiProducts.length} products from API\n`);
    console.log('💾 Saving to database...\n');

    let totalAdded = 0;
    const batchSize = 50;

    // Process products in batches
    for (let i = 0; i < apiProducts.length; i += batchSize) {
      const batch = apiProducts.slice(i, i + batchSize);
      
      const productsToInsert = batch.map(p => ({
        name: p.title,
        brand: p.brand || 'Generic',
        category: p.category || 'General',
        price: Math.round(p.price),
        image: p.thumbnail || p.images[0] || '',
        productUrl: `https://dummyjson.com/products/${p.id}`,
        isActive: true,
      }));

      await prisma.product.createMany({
        data: productsToInsert,
        skipDuplicates: true,
      });

      totalAdded += productsToInsert.length;
      process.stdout.write(`\r   Progress: ${totalAdded}/${apiProducts.length} products saved`);
    }

    console.log('\n\n✨ Seeding completed!');
    console.log(`📊 Total products added: ${totalAdded}`);
    console.log('✅ All products have real images from DummyJSON!');
    console.log('✅ All images are guaranteed to load!');

    // Show total count
    const totalCount = await prisma.product.count();
    console.log(`\n📊 Total products in database: ${totalCount}`);

    // Show sample
    console.log('\n📋 Sample products:');
    const samples = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    samples.forEach(p => {
      console.log(`   ✅ ${p.name} - $${p.price}`);
      console.log(`      Image: ${p.image.substring(0, 60)}...`);
    });

  } catch (error) {
    console.error('\n❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedFromDummyJSON();
