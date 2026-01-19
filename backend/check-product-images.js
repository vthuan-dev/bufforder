const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductImages() {
  console.log('🔍 Checking product images...\n');
  
  try {
    // Get all products
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Check last 50 products
    });
    
    console.log(`📊 Checking ${products.length} most recent products...\n`);
    
    let errorCount = 0;
    let nullImageCount = 0;
    let validCount = 0;
    
    const imageStats = {};
    
    for (const product of products) {
      // Check if image is null or empty
      if (!product.image || product.image.trim() === '') {
        nullImageCount++;
        console.log(`❌ NULL/EMPTY: ${product.name} (ID: ${product.id})`);
        continue;
      }
      
      // Check if image URL is valid
      if (!product.image.startsWith('http')) {
        errorCount++;
        console.log(`❌ INVALID URL: ${product.name} - ${product.image}`);
        continue;
      }
      
      // Count image usage
      if (imageStats[product.image]) {
        imageStats[product.image]++;
      } else {
        imageStats[product.image] = 1;
      }
      
      validCount++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Valid images: ${validCount}`);
    console.log(`   ❌ Null/Empty images: ${nullImageCount}`);
    console.log(`   ❌ Invalid URLs: ${errorCount}`);
    
    // Show duplicate images
    console.log('\n🔄 Image duplication analysis:');
    const duplicates = Object.entries(imageStats)
      .filter(([url, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (duplicates.length > 0) {
      console.log('   Top 10 most used images:');
      duplicates.forEach(([url, count]) => {
        console.log(`   - Used ${count} times: ${url.substring(0, 60)}...`);
      });
    } else {
      console.log('   ✅ No duplicate images found!');
    }
    
    // Show sample of valid products
    console.log('\n📋 Sample of valid products:');
    products
      .filter(p => p.image && p.image.startsWith('http'))
      .slice(0, 5)
      .forEach(p => {
        console.log(`   ✅ ${p.name}`);
        console.log(`      Image: ${p.image.substring(0, 70)}...`);
        console.log(`      Created: ${p.createdAt.toISOString()}`);
      });
    
  } catch (error) {
    console.error('\n❌ Error checking images:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkProductImages();
