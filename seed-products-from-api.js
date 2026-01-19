const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function fetchProductsFromAPI() {
  console.log('📦 Fetching products from DummyJSON API...');
  
  try {
    // DummyJSON has 194 products, we'll fetch all and add a few more manually to reach 200
    const response = await fetch('https://dummyjson.com/products?limit=194');
    const data = await response.json();
    
    console.log(`✅ Fetched ${data.products.length} products from API`);
    
    return data.products;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
}

async function seedProducts() {
  console.log('🌱 Starting product seeding...');
  
  try {
    // Fetch products from API
    const apiProducts = await fetchProductsFromAPI();
    
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await prisma.product.deleteMany({});
    
    // Transform and insert products
    console.log('💾 Inserting products into database...');
    
    const productsToInsert = apiProducts.map(product => ({
      name: product.title,
      brand: product.brand || 'Generic',
      category: product.category || 'General',
      price: parseFloat(product.price),
      image: product.thumbnail || product.images?.[0] || null,
      productUrl: `https://dummyjson.com/products/${product.id}`,
      isActive: true
    }));
    
    // Insert in batches of 50 to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch
      });
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsToInsert.length / batchSize)}`);
    }
    
    // Add 6 more products manually to reach 200
    const additionalProducts = [
      {
        name: 'Premium Wireless Headphones',
        brand: 'AudioTech',
        category: 'electronics',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        productUrl: 'https://www.amazon.com/headphones',
        isActive: true
      },
      {
        name: 'Smart Fitness Watch',
        brand: 'FitPro',
        category: 'electronics',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        productUrl: 'https://www.amazon.com/smartwatch',
        isActive: true
      },
      {
        name: 'Portable Bluetooth Speaker',
        brand: 'SoundWave',
        category: 'electronics',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        productUrl: 'https://www.amazon.com/speaker',
        isActive: true
      },
      {
        name: 'Professional Camera Lens',
        brand: 'LensMaster',
        category: 'electronics',
        price: 899.99,
        image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400',
        productUrl: 'https://www.amazon.com/camera-lens',
        isActive: true
      },
      {
        name: 'Gaming Mechanical Keyboard',
        brand: 'KeyTech',
        category: 'electronics',
        price: 149.99,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
        productUrl: 'https://www.amazon.com/keyboard',
        isActive: true
      },
      {
        name: 'Ergonomic Office Chair',
        brand: 'ComfortSeating',
        category: 'furniture',
        price: 399.99,
        image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400',
        productUrl: 'https://www.amazon.com/office-chair',
        isActive: true
      }
    ];
    
    await prisma.product.createMany({
      data: additionalProducts
    });
    
    console.log('✅ Added 6 additional products');
    
    // Get final count
    const totalProducts = await prisma.product.count();
    console.log(`\n🎉 Successfully seeded ${totalProducts} products!`);
    
    // Show category breakdown
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log('\n📊 Products by category:');
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedProducts()
  .then(() => {
    console.log('\n✅ Product seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Product seeding failed:', error);
    process.exit(1);
  });
