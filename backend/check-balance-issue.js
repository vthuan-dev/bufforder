const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBalanceIssue() {
  try {
    // Find user with phone 0907273728
    const user = await prisma.user.findFirst({
      where: { phoneNumber: '0907273728' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 USER BALANCE STATE:');
    console.log('User ID:', user.id);
    console.log('Phone:', user.phone);
    console.log('Balance:', user.balance);
    console.log('Frozen Balance:', user.frozenBalance);
    console.log('Is Frozen:', user.isFrozen);
    console.log('Commission:', user.commission);
    console.log('Total Deposited:', user.totalDeposited);

    // Check commission config
    let config = {};
    try {
      config = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
    } catch (e) {
      console.log('⚠️ Failed to parse commissionConfig');
    }
    console.log('\n🔧 COMMISSION CONFIG:');
    console.log(JSON.stringify(config, null, 2));

    // Find suspended order
    const suspendedOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'suspended'
      },
      orderBy: { orderDate: 'desc' }
    });

    if (suspendedOrder) {
      console.log('\n📦 SUSPENDED ORDER:');
      console.log('Order ID:', suspendedOrder.id);
      console.log('Order Number:', suspendedOrder.orderNumber);
      console.log('Product Price:', suspendedOrder.productPrice);
      console.log('Commission Amount:', suspendedOrder.commissionAmount);
      console.log('Status:', suspendedOrder.status);
    } else {
      console.log('\n✅ No suspended orders');
    }

    // Find recent deposit requests
    const deposits = await prisma.depositRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n💰 RECENT DEPOSITS:');
    deposits.forEach(d => {
      console.log(`- ${d.amount} | ${d.status} | ${d.createdAt}`);
    });

    // Find recent orders
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { orderDate: 'desc' },
      take: 5
    });

    console.log('\n📋 RECENT ORDERS:');
    orders.forEach(o => {
      console.log(`- ${o.orderNumber} | ${o.status} | Price: ${o.productPrice} | Commission: ${o.commissionAmount}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBalanceIssue();
