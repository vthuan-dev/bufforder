const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function fetchAndUpdateProducts() {
  console.log('📦 Fetching products from DummyJSON API...');
  
  try {
    const response = await fetch('https://dummyjson.com/products?limit=194');
    const data = await response.json();
    
    console.log(`✅ Fetched ${data.products.length} products`);
    console.log('🗑️  Clearing old products...');
    await prisma.product.deleteMany({});
    
    console.log('💾 Inserting updated products...');
    
    // Transform products with better images and updated info
    const products = data.products.map(product => ({
      name: product.title,
      brand: product.brand || 'Generic',
      category: product.category || 'General',
      price: parseFloat(product.price),
      image: product.thumbnail || product.images?.[0] || null,
      productUrl: `https://dummyjson.com/products/${product.id}`,
      isActive: true
    }));
    
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await prisma.product.createMany({ data: batch });
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
    }
    
    // Add 6 modern flagship products with Unsplash images
    const modernProducts = [
      { name: "iPhone 15 Pro Max 256GB", brand: "Apple", category: "smartphones", price: 1199, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400", productUrl: "https://www.apple.com/iphone-15-pro/", isActive: true },
      { name: "Samsung Galaxy S24 Ultra", brand: "Samsung", category: "smartphones", price: 1299, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400", productUrl: "https://www.samsung.com/galaxy-s24-ultra/", isActive: true },
      { name: "MacBook Pro 16 M3 Max", brand: "Apple", category: "laptops", price: 3499, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", productUrl: "https://www.apple.com/macbook-pro-16/", isActive: true },
      { name: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "electronics", price: 399, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", productUrl: "https://www.sony.com/wh-1000xm5", isActive: true },
      { name: "Apple Watch Ultra 2", brand: "Apple", category: "electronics", price: 799, image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400", productUrl: "https://www.apple.com/apple-watch-ultra-2/", isActive: true },
      { name: "AirPods Pro 2nd Gen", brand: "Apple", category: "electronics", price: 249, image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400", productUrl: "https://www.apple.com/airpods-pro/", isActive: true }
    ];
    
    await prisma.product.createMany({ data: modernProducts });
    console.log('✅ Added 6 modern flagship products');
    
    const total = await prisma.product.count();
    console.log(`\n🎉 Successfully seeded ${total} products!`);
    
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log('\n📊 Products by category:');
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fetchAndUpdateProducts();
