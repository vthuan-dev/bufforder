const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkUserBalance() {
  try {
    // Find user by phone number from the screenshot
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: '0706871283'
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        balance: true,
        freezeBalance: true,
        commission: true,
        vipLevel: true,
        totalDeposited: true,
        isFrozen: true
      }
    });

    if (!user) {
      console.log('❌ User not found with phone 0706871283');
      return;
    }

    console.log('\n✅ User found:');
    console.log('=====================================');
    console.log('ID:', user.id);
    console.log('Full Name:', user.fullName);
    console.log('Phone:', user.phoneNumber);
    console.log('VIP Level:', user.vipLevel);
    console.log('=====================================');
    console.log('💰 Balance:', user.balance);
    console.log('❄️  Freeze Balance:', user.freezeBalance);
    console.log('💵 Commission:', user.commission);
    console.log('💳 Total Deposited:', user.totalDeposited);
    console.log('🔒 Is Frozen:', user.isFrozen);
    console.log('=====================================\n');

    // Check if balance is actually 5000
    if (user.balance === 5000) {
      console.log('✅ Balance is correctly set to 5000 in database');
    } else {
      console.log(`⚠️  Balance is ${user.balance}, not 5000!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserBalance();
