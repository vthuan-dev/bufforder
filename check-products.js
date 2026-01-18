const prisma = require('./backend/lib/prisma');

(async () => {
  try {
    const products = await prisma.product.findMany({ take: 20 });
    console.log('\n=== PRODUCTS IN DATABASE ===');
    console.log('Total products:', products.length);
    console.log('\nProduct IDs and Names:');
    products.forEach(p => {
      console.log(`  ID: ${p.id} - ${p.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
