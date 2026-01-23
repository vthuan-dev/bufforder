const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function debugNewUser() {
  try {
    // Find the newest user (most recently created)
    const newestUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        createdAt: true,
        balance: true,
        commission: true,
        vipLevel: true,
        totalDeposited: true
      }
    });

    if (!newestUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('\n📊 Newest User:');
    console.log('  Phone:', newestUser.phoneNumber);
    console.log('  Name:', newestUser.fullName);
    console.log('  ID:', newestUser.id);
    console.log('  Created:', newestUser.createdAt);
    console.log('  Balance:', newestUser.balance);
    console.log('  Commission:', newestUser.commission);
    console.log('  VIP Level:', newestUser.vipLevel);
    console.log('  Total Deposited:', newestUser.totalDeposited);

    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    console.log('\n📅 Today\'s Date Range:');
    console.log('  Start:', startOfDay.toISOString());
    console.log('  End:', endOfDay.toISOString());

    // Get ALL orders for this user (not just today)
    const allOrders = await prisma.order.findMany({
      where: { userId: newestUser.id },
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

    console.log('\n📦 ALL Orders for this user:', allOrders.length);
    if (allOrders.length > 0) {
      allOrders.forEach((order, idx) => {
        console.log(`\n  Order ${idx + 1}:`);
        console.log('    ID:', order.id);
        console.log('    Number:', order.orderNumber);
        console.log('    Date:', order.orderDate.toISOString());
        console.log('    Status:', order.status);
        console.log('    Product:', order.productName);
        console.log('    Price:', order.productPrice);
        console.log('    Commission:', order.commissionAmount);
      });
    }

    // Get today's orders specifically
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: newestUser.id,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });

    console.log('\n📦 Today\'s Orders:', todayOrders.length);
    if (todayOrders.length > 0) {
      todayOrders.forEach((order, idx) => {
        console.log(`\n  Today Order ${idx + 1}:`);
        console.log('    ID:', order.id);
        console.log('    Number:', order.orderNumber);
        console.log('    Date:', order.orderDate.toISOString());
        console.log('    Status:', order.status);
      });
    }

    // Check if there are orders from OTHER dates
    const otherDateOrders = allOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate < startOfDay || orderDate >= endOfDay;
    });

    if (otherDateOrders.length > 0) {
      console.log('\n⚠️  WARNING: Found orders from OTHER dates:', otherDateOrders.length);
      otherDateOrders.forEach((order, idx) => {
        console.log(`\n  Other Date Order ${idx + 1}:`);
        console.log('    Date:', order.orderDate.toISOString());
        console.log('    Status:', order.status);
        console.log('    Product:', order.productName);
      });
    }

    // Check dailyEarnings field
    const userWithEarnings = await prisma.user.findUnique({
      where: { id: newestUser.id },
      select: { dailyEarnings: true }
    });

    console.log('\n💰 Daily Earnings Field:');
    console.log('  Raw:', userWithEarnings.dailyEarnings);
    try {
      const parsed = JSON.parse(userWithEarnings.dailyEarnings || '{}');
      console.log('  Parsed:', parsed);
    } catch (e) {
      console.log('  Parse Error:', e.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNewUser();
