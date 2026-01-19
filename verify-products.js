const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function verifyProducts() {
  try {
    // Count total products
    const total = await prisma.product.count();
    console.log(`\n📦 Total products in database: ${total}`);
    
    // Count products with URLs
    const withUrls = await prisma.product.count({
      where: {
        productUrl: { not: null }
      }
    });
    console.log(`🔗 Products with URLs: ${withUrls}`);
    
    // Show sample products
    console.log('\n📋 Sample products:\n');
    const samples = await prisma.product.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        price: true,
        productUrl: true
      }
    });
    
    samples.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   Brand: ${p.brand} | Category: ${p.category} | Price: $${p.price}`);
      console.log(`   URL: ${p.productUrl || 'N/A'}`);
      console.log('');
    });
    
    // Category breakdown
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });
    
    console.log('📊 Products by category:');
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProducts();
