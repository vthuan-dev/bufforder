const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFreezeConfig() {
  try {
    // Find ALL users with "trai nghiem"
    const users = await prisma.user.findMany({
      where: {
        fullName: { contains: 'trai nghiem' }
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        commissionConfig: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    console.log(`✅ Found ${users.length} user(s) with "trai nghiem":\n`);

    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 User:', user.fullName);
      console.log('📱 Phone:', user.phoneNumber);
      console.log('🆔 ID:', user.id);
      
      let config = {};
      try {
        config = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
      } catch (e) {
        console.log('⚠️  Failed to parse commissionConfig');
        config = {};
      }
      
      console.log('\n🎯 Freeze Settings:');
      console.log('  - autoFreezeThreshold:', config.autoFreezeThreshold || 'NOT SET');
      console.log('  - freezeTargetProductId:', config.freezeTargetProductId || 'NOT SET');
      console.log('  - freezeTargetPrice:', config.freezeTargetPrice || 'NOT SET');

      if (config.freezeTargetProductId) {
        console.log('\n🔍 Looking up target product...');
        const product = await prisma.product.findUnique({
          where: { id: parseInt(config.freezeTargetProductId) },
          select: {
            id: true,
            name: true,
            brand: true,
            price: true
          }
        });

        if (product) {
          console.log('✅ Target Product Found:');
          console.log('  - Name:', product.name);
          console.log('  - Brand:', product.brand);
          console.log('  - Price: $' + product.price);
        } else {
          console.log('❌ Target product not found in database!');
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFreezeConfig();
