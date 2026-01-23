const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificUser() {
  try {
    const phoneNumber = '09045216262';
    
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        createdAt: true,
        balance: true,
        commission: true,
        vipLevel: true,
        totalDeposited: true,
        dailyEarnings: true
      }
    });

    if (!user) {
      console.log(`❌ User with phone ${phoneNumber} not found`);
      return;
    }

    console.log('\n📊 USER INFO:');
    console.log('─'.repeat(60));
    console.log(`Phone: ${user.phoneNumber}`);
    console.log(`Name: ${user.fullName}`);
    console.log(`ID: ${user.id}`);
    console.log(`Created: ${user.createdAt.toISOString()}`);
    console.log(`Balance: ${user.balance}`);
    console.log(`Commission: ${user.commission}`);
    console.log(`VIP Level: ${user.vipLevel}`);
    console.log(`Total Deposited: ${user.totalDeposited}`);

    // Parse dailyEarnings
    let dailyEarnings = {};
    try {
      dailyEarnings = JSON.parse(user.dailyEarnings || '{}');
    } catch (e) {
      console.log('❌ Failed to parse dailyEarnings');
    }
    
    console.log('\n💰 DAILY EARNINGS FIELD:');
    console.log('─'.repeat(60));
    console.log('Raw:', user.dailyEarnings);
    console.log('Parsed:', dailyEarnings);

    // Get today's date range (same logic as backend)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    console.log('\n📅 TODAY\'S DATE RANGE (Backend Logic):');
    console.log('─'.repeat(60));
    console.log(`Start: ${startOfDay.toISOString()}`);
    console.log(`End: ${endOfDay.toISOString()}`);
    console.log(`Current time: ${now.toISOString()}`);

    // Get ALL orders for this user
    const allOrders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { orderDate: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        status: true,
        productName: true,
        productPrice: true,
        commissionAmount: true
      }
    });
    
    console.log(`\n📦 ALL ORDERS: ${allOrders.length}`);
    console.log('─'.repeat(60));

    // Get today's orders using backend logic
    const todayOrders = allOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= startOfDay && orderDate < endOfDay;
    });
    
    console.log(`\n📦 TODAY'S ORDERS (Backend Logic): ${todayOrders.length}`);
    console.log('─'.repeat(60));

    if (todayOrders.length > 0) {
      todayOrders.forEach((order, idx) => {
        console.log(`\n  ${idx + 1}. ${order.orderNumber}`);
        console.log(`     Date: ${order.orderDate.toISOString()}`);
        console.log(`     Status: ${order.status}`);
        console.log(`     Product: ${order.productName}`);
        console.log(`     Price: ${order.productPrice}`);
        console.log(`     Commission: ${order.commissionAmount}`);
      });
    } else {
      console.log('  (No orders today)');
    }

    // Check for mismatch
    const dailyOrdersCount = dailyEarnings.ordersCount || 0;
    
    console.log('\n⚠️  COMPARISON:');
    console.log('─'.repeat(60));
    console.log(`dailyEarnings.ordersCount: ${dailyOrdersCount}`);
    console.log(`Actual today's orders: ${todayOrders.length}`);
    console.log(`Difference: ${dailyOrdersCount - todayOrders.length}`);
    
    if (dailyOrdersCount !== todayOrders.length) {
      console.log('\n🔴 MISMATCH DETECTED!');
      console.log('This explains why Orders Received shows wrong number.');
      
      // Show recent orders to understand the issue
      if (allOrders.length > 0) {
        console.log(`\n📋 RECENT ORDERS (Last 10):`);
        console.log('─'.repeat(60));
        allOrders.slice(0, 10).forEach((order, idx) => {
          const orderDate = new Date(order.orderDate);
          const isToday = orderDate >= startOfDay && orderDate < endOfDay;
          console.log(`\n  ${idx + 1}. ${order.orderNumber}`);
          console.log(`     Date: ${orderDate.toISOString()}`);
          console.log(`     Status: ${order.status} ${isToday ? '✅ TODAY' : '❌ NOT TODAY'}`);
        });
      }
    } else {
      console.log('\n✅ Orders count matches!');
    }

    // Show what the API would return
    console.log('\n🔍 WHAT API RETURNS:');
    console.log('─'.repeat(60));
    console.log(`ordersGrabbed: ${todayOrders.length} (from todayOrders.length)`);
    console.log(`completedToday: ${todayOrders.length} (same as ordersGrabbed)`);
    console.log(`dailyEarnings.ordersCount: ${dailyOrdersCount} (from dailyEarnings field)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificUser();
