const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteRecentProducts() {
  console.log('🗑️  Deleting products created in the last 10 minutes...\n');
  
  try {
    // Calculate timestamp for 10 minutes ago
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    console.log(`⏰ Current time: ${new Date().toISOString()}`);
    console.log(`⏰ Deleting products created after: ${tenMinutesAgo.toISOString()}\n`);
    
    // Find products created in last 10 minutes
    const recentProducts = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: tenMinutesAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${recentProducts.length} products created in the last 10 minutes`);
    
    if (recentProducts.length === 0) {
      console.log('✅ No recent products to delete!');
      return;
    }
    
    // Show sample of products to be deleted
    console.log('\n📋 Sample of products to be deleted:');
    recentProducts.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id}, Created: ${p.createdAt.toISOString()})`);
    });
    if (recentProducts.length > 5) {
      console.log(`   ... and ${recentProducts.length - 5} more`);
    }
    
    // Delete the products
    console.log(`\n🗑️  Deleting ${recentProducts.length} products...`);
    
    const result = await prisma.product.deleteMany({
      where: {
        createdAt: {
          gte: tenMinutesAgo
        }
      }
    });
    
    console.log(`\n✅ Successfully deleted ${result.count} products!`);
    
    // Show remaining count
    const remainingCount = await prisma.product.count();
    console.log(`📊 Remaining products in database: ${remainingCount}`);
    
  } catch (error) {
    console.error('\n❌ Error deleting products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteRecentProducts();
