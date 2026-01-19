const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate products...');
  
  try {
    // Keep only the first 220 products (original + fashion)
    // Delete the 2000 duplicates added by seed-2k-products.js
    
    const allProducts = await prisma.product.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Total products in database: ${allProducts.length}`);
    
    if (allProducts.length > 220) {
      const productsToDelete = allProducts.slice(220); // Keep first 220
      const idsToDelete = productsToDelete.map(p => p.id);
      
      console.log(`🗑️  Deleting ${idsToDelete.length} duplicate products...`);
      
      await prisma.product.deleteMany({
        where: {
          id: {
            in: idsToDelete
          }
        }
      });
      
      console.log('✅ Cleanup completed!');
      console.log(`📊 Remaining products: 220`);
    } else {
      console.log('✅ No duplicates found. Database is clean!');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
