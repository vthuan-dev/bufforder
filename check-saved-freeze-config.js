const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFreezeConfig() {
  try {
    // Find user "trai nghiem"
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { fullName: { contains: 'trai nghiem' } },
          { phoneNumber: '0706871211' }
        ]
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        commissionConfig: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Found user:', user.fullName);
    console.log('📱 Phone:', user.phoneNumber);
    console.log('\n📊 Commission Config:');
    console.log(JSON.stringify(user.commissionConfig, null, 2));

    const config = user.commissionConfig || {};
    
    console.log('\n🎯 Freeze Settings:');
    console.log('  - autoFreezeThreshold:', config.autoFreezeThreshold || 'NOT SET');
    console.log('  - freezeTargetProductId:', config.freezeTargetProductId || 'NOT SET');
    console.log('  - freezeTargetPrice:', config.freezeTargetPrice || 'NOT SET');

    if (config.freezeTargetProductId) {
      console.log('\n🔍 Looking up target product...');
      const product = await prisma.product.findUnique({
        where: { id: String(config.freezeTargetProductId) },
        select: {
          id: true,
          name: true,
          brand: true,
          price: true,
          image: true
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

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFreezeConfig();
