const prisma = require('./backend/lib/prisma');

async function checkFreezeStatus() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: '0706871211'
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n👤 User Freeze Status:\n');
    console.log(`Name: ${user.fullName}`);
    console.log(`Phone: ${user.phoneNumber}`);
    console.log(`\n💰 Balance Info:`);
    console.log(`   Available Balance: $${user.balance}`);
    console.log(`   Frozen Balance: $${user.frozenBalance || 0}`);
    console.log(`\n🔒 Freeze Status:`);
    console.log(`   Is Frozen: ${user.isFrozen ? '✅ YES' : '❌ NO'}`);
    
    if (user.isFrozen) {
      console.log(`   Frozen At: ${user.frozenAt}`);
      console.log(`   Frozen Reason: ${user.frozenReason || 'N/A'}`);
    }

    // Count today's orders
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayOrders = await prisma.order.count({
      where: {
        userId: user.id,
        orderDate: {
          gte: todayStart
        }
      }
    });

    console.log(`\n📦 Orders Today: ${todayOrders}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFreezeStatus();
