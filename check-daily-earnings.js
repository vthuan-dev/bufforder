const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDailyEarnings() {
  try {
    const user = await prisma.user.findFirst({
      where: { phoneNumber: '18122217257' },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        balance: true,
        commission: true,
        dailyEarnings: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 User Info:');
    console.log('ID:', user.id);
    console.log('Name:', user.fullName);
    console.log('Phone:', user.phoneNumber);
    console.log('Balance:', user.balance);
    console.log('Total Commission:', user.commission);
    
    console.log('\n📈 Daily Earnings (Raw JSON):');
    console.log(user.dailyEarnings);

    let dailyEarnings = {};
    try {
      dailyEarnings = JSON.parse(user.dailyEarnings || '{}');
    } catch {
      dailyEarnings = {};
    }

    console.log('\n📈 Daily Earnings (Parsed):');
    console.log('Date Key:', dailyEarnings.dateKey);
    console.log('Total Commission:', dailyEarnings.totalCommission);
    console.log('Orders Count:', dailyEarnings.ordersCount);
    console.log('Target Total:', dailyEarnings.targetTotal);
    console.log('Number of Orders:', dailyEarnings.numberOfOrders);

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        orderDate: { gte: today }
      },
      select: {
        id: true,
        productPrice: true,
        commissionAmount: true,
        status: true
      }
    });

    console.log('\n📦 Today\'s Orders:');
    console.log('Total Orders:', todayOrders.length);
    
    const totalProductPrice = todayOrders.reduce((sum, o) => sum + o.productPrice, 0);
    const totalCommission = todayOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
    
    console.log('Total Product Price:', totalProductPrice.toFixed(2));
    console.log('Total Commission:', totalCommission.toFixed(2));

    console.log('\n⚠️  ISSUE DETECTED:');
    if (dailyEarnings.totalCommission > 1000) {
      console.log('❌ dailyEarnings.totalCommission is TOO HIGH:', dailyEarnings.totalCommission);
      console.log('✅ Should be (from orders):', totalCommission.toFixed(2));
      console.log('\n💡 The dailyEarnings.totalCommission might be storing PRODUCT PRICE instead of COMMISSION!');
    } else {
      console.log('✅ dailyEarnings.totalCommission looks correct');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDailyEarnings();
