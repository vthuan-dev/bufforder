const prisma = require('./backend/lib/prisma');

(async () => {
  try {
    // Get all orders for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        orderDate: { gte: startOfDay, lt: endOfDay }
      },
      orderBy: { orderDate: 'desc' }
    });

    console.log('\n=== TODAY\'S ORDERS SUMMARY ===');
    console.log('Total orders today:', orders.length);
    
    // Group by user
    const ordersByUser = {};
    orders.forEach(order => {
      if (!ordersByUser[order.userId]) {
        ordersByUser[order.userId] = [];
      }
      ordersByUser[order.userId].push(order);
    });

    console.log('\n=== ORDERS BY USER ===');
    for (const [userId, userOrders] of Object.entries(ordersByUser)) {
      console.log(`\nUser ID: ${userId}`);
      console.log(`Total orders: ${userOrders.length}`);
      console.log('Orders:');
      userOrders.forEach((order, idx) => {
        console.log(`  ${idx + 1}. ${order.productName} (Product ID: ${order.productId})`);
        console.log(`     Order ID: ${order.id}`);
        console.log(`     Time: ${order.orderDate.toLocaleString()}`);
        console.log(`     ClientRequestId: ${order.clientRequestId || 'none'}`);
      });
    }

    // Check for TRUE duplicates (same user, same product, same time)
    console.log('\n=== CHECKING FOR TRUE DUPLICATES ===');
    console.log('(Same user + same product within 1 minute)');
    let trueDuplicatesFound = false;
    
    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const order1 = orders[i];
        const order2 = orders[j];
        
        // TRUE duplicate: same user AND same product
        if (order1.userId === order2.userId && 
            order1.productId === order2.productId) {
          const timeDiff = Math.abs(order1.orderDate - order2.orderDate) / 1000; // seconds
          if (timeDiff < 60) {
            console.log(`\n⚠️  TRUE DUPLICATE FOUND:`);
            console.log(`   Order ${order1.id}: ${order1.productName} (Product ID: ${order1.productId})`);
            console.log(`   Time: ${order1.orderDate.toLocaleString()}`);
            console.log(`   ClientRequestId: ${order1.clientRequestId || 'none'}`);
            console.log(`   ---`);
            console.log(`   Order ${order2.id}: ${order2.productName} (Product ID: ${order2.productId})`);
            console.log(`   Time: ${order2.orderDate.toLocaleString()}`);
            console.log(`   ClientRequestId: ${order2.clientRequestId || 'none'}`);
            console.log(`   Time difference: ${timeDiff.toFixed(1)} seconds`);
            trueDuplicatesFound = true;
          }
        }
      }
    }
    
    if (!trueDuplicatesFound) {
      console.log('✅ No true duplicates found (all orders are for different products)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
