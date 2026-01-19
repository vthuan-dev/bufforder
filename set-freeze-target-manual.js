/**
 * Manually set freeze target product for testing
 */

const prisma = require('./backend/lib/prisma');

async function setFreezeTarget() {
  try {
    console.log('🔧 Setting freeze target product manually...\n');
    
    // Find user
    const user = await prisma.user.findFirst({
      where: { phoneNumber: '0706871211' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.fullName);
    
    // Find a product around $2000
    const product = await prisma.product.findFirst({
      where: {
        price: {
          gte: 1600,
          lte: 2400
        }
      },
      orderBy: {
        price: 'desc'
      }
    });
    
    if (!product) {
      console.log('❌ No product found in price range $1600-$2400');
      return;
    }
    
    console.log('✅ Target product found:');
    console.log('   ID:', product.id);
    console.log('   Name:', product.name);
    console.log('   Brand:', product.brand);
    console.log('   Price: $' + product.price);
    console.log('');
    
    // Parse existing config
    let config = {};
    try {
      config = typeof user.commissionConfig === 'string' 
        ? JSON.parse(user.commissionConfig) 
        : user.commissionConfig || {};
    } catch (e) {}
    
    // Update config with target product
    config.freezeTargetProductId = product.id;
    config.freezeTargetPrice = product.price;
    
    // Save to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        commissionConfig: JSON.stringify(config)
      }
    });
    
    console.log('✅ Updated commission config:');
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    console.log('🎯 Now when user reaches order #' + (config.autoFreezeThreshold || 'N/A'));
    console.log('   Product "' + product.name + '" will be shown!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setFreezeTarget();
