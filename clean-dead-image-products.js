const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDeadImageProducts() {
  console.log('🔍 Checking for products with dead image domains...\n');

  const deadDomains = ['placeimg.com', 'lorempixel.com'];
  
  try {
    // Find products with dead domains
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        image: true
      }
    });

    const productsToDelete = allProducts.filter(p => {
      return deadDomains.some(domain => p.image?.includes(domain));
    });

    console.log(`Found ${productsToDelete.length} products with dead image domains:`);
    productsToDelete.forEach(p => {
      console.log(`  - ${p.name} (${p.image})`);
    });

    if (productsToDelete.length === 0) {
      console.log('\n✅ No products with dead domains found!');
      return;
    }

    console.log(`\n🗑️  Deleting ${productsToDelete.length} products...`);

    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: productsToDelete.map(p => p.id)
        }
      }
    });

    console.log(`✅ Deleted ${result.count} products with dead image domains!`);
    
    // Show remaining count
    const remaining = await prisma.product.count();
    console.log(`📊 Remaining products in database: ${remaining}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDeadImageProducts();
