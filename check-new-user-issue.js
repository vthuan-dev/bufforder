const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkNewUserIssue() {
  try {
    // Find users created in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: oneDayAgo }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        createdAt: true,
        balance: true,
        commission: true,
        dailyEarnings: true
      }
    });

    console.log(`\n📊 Found ${recentUsers.length} users created in last 24 hours:\n`);

    for (const user of recentUsers) {
      console.log('─'.repeat(60));
      console.log(`User: ${user.fullName} (${user.phoneNumber})`);
      console.log(`Created: ${user.createdAt.toISOString()}`);
      console.log(`Balance: ${user.balance}`);
      console.log(`Commission: ${user.commission}`);
      
      // Parse dailyEarnings
      let dailyEarnings = {};
      try {
        dailyEarnings = JSON.parse(user.dailyEarnings || '{}');
      } catch (e) {
        console.log('❌ Failed to parse dailyEarnings');
      }
      
      console.log('Daily Earnings:', dailyEarnings);
      
      // Get today's date range (same logic as backend)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      console.log(`Today range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
      
      // Get ALL orders for this user
      const allOrders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { orderDate: 'desc' }
      });
      
      console.log(`Total orders: ${allOrders.length}`);
      
      // Get today's orders using backend logic
      const todayOrders = await prisma.order.findMany({
        where: {
          userId: user.id,
          orderDate: { gte: startOfDay, lt: endOfDay }
        }
      });
      
      console.log(`Today's orders (backend logic): ${todayOrders.length}`);
      
      // Check if dailyEarnings.ordersCount matches actual today's orders
      const dailyOrdersCount = dailyEarnings.ordersCount || 0;
      
      if (dailyOrdersCount !== todayOrders.length) {
        console.log(`\n⚠️  MISMATCH DETECTED!`);
        console.log(`   dailyEarnings.ordersCount: ${dailyOrdersCount}`);
        console.log(`   Actual today's orders: ${todayOrders.length}`);
        console.log(`   Difference: ${dailyOrdersCount - todayOrders.length}`);
        
        // Show when orders were actually created
        if (allOrders.length > 0) {
          console.log(`\n   Recent orders:`);
          allOrders.slice(0, 5).forEach((order, idx) => {
            const orderDate = new Date(order.orderDate);
            const isToday = orderDate >= startOfDay && orderDate < endOfDay;
            console.log(`     ${idx + 1}. ${order.orderNumber} - ${orderDate.toISOString()} ${isToday ? '✅ TODAY' : '❌ NOT TODAY'}`);
          });
        }
      } else {
        console.log(`✅ Orders count matches!`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewUserIssue();
