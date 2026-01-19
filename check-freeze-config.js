/**
 * Check if freezeTargetProductId is saved in user's commissionConfig
 */

const prisma = require('./backend/lib/prisma');

async function checkFreezeConfig() {
  try {
    console.log('🔍 Checking freeze configuration for user: trai nghiem\n');
    
    const user = await prisma.user.findFirst({
      where: { phoneNumber: '0706871211' } // trai nghiem's phone
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.fullName);
    console.log('📧 Email:', user.email);
    console.log('📱 Phone:', user.phoneNumber);
    console.log('🎯 VIP Level:', user.vipLevel);
    console.log('💰 Balance:', user.balance);
    console.log('');
    
    // Parse commissionConfig
    let config = {};
    try {
      config = typeof user.commissionConfig === 'string' 
        ? JSON.parse(user.commissionConfig) 
        : user.commissionConfig || {};
    } catch (e) {
      console.log('⚠️ Error parsing commissionConfig:', e.message);
    }
    
    console.log('⚙️ Commission Config:');
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    
    // Check specific fields
    console.log('🔒 Freeze Settings:');
    console.log('   autoFreezeThreshold:', config.autoFreezeThreshold || 'NOT SET');
    console.log('   freezeTargetProductId:', config.freezeTargetProductId || 'NOT SET');
    console.log('   freezeTargetPrice:', config.freezeTargetPrice || 'NOT SET');
    console.log('');
    
    // Check if target product exists
    if (config.freezeTargetProductId) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(config.freezeTargetProductId) }
      });
      
      if (product) {
        console.log('✅ Target Product Found:');
        console.log('   ID:', product.id);
        console.log('   Name:', product.name);
        console.log('   Brand:', product.brand);
        console.log('   Price:', product.price);
        console.log('   Image:', product.image ? 'Yes' : 'No');
      } else {
        console.log('❌ Target Product NOT FOUND in database!');
        console.log('   Looking for product ID:', config.freezeTargetProductId);
      }
    } else {
      console.log('⚠️ No target product ID set');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFreezeConfig();
