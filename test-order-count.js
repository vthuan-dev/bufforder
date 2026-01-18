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

    console.log('\n=== TODAY\'S ORDERS ===');
    console.log('Total orders today:', orders.length);
    console.log('\nOrders by user:');
    
    const ordersByUser = {};
    orders.forEach(order => {
      if (!ordersByUser[order.userId]) {
        ordersByUser[order.userId] = [];
      }
      ordersByUser[order.userId].push({
        id: order.id,
        productName: order.productName,
        orderDate: order.orderDate,
        clientRequestId: order.clientRequestId
      });
    });

    for (const [userId, userOrders] of Object.entries(ordersByUser)) {
      console.log(`\nUser ID ${userId}: ${userOrders.length} orders`);
      userOrders.forEach((order, idx) => {
        console.log(`  ${idx + 1}. ${order.productName} - ${order.orderDate.toLocaleString()}`);
        console.log(`     ID: ${order.id}, ClientRequestId: ${order.clientRequestId || 'none'}`);
      });
    }

    // Check for potential duplicates (same product, same user, within 1 minute)
    console.log('\n=== CHECKING FOR DUPLICATES ===');
    let duplicatesFound = false;
    
    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const order1 = orders[i];
        const order2 = orders[j];
        
        if (order1.userId === order2.userId && 
            order1.productId === order2.productId) {
          const timeDiff = Math.abs(order1.orderDate - order2.orderDate) / 1000; // seconds
          if (timeDiff < 60) {
            console.log(`⚠️  Potential duplicate found:`);
            console.log(`   Order ${order1.id}: ${order1.productName} at ${order1.orderDate.toLocaleString()}`);
            console.log(`   Order ${order2.id}: ${order2.productName} at ${order2.orderDate.toLocaleString()}`);
            console.log(`   Time difference: ${timeDiff.toFixed(1)} seconds`);
            duplicatesFound = true;
          }
        }
      }
    }
    
    if (!duplicatesFound) {
      console.log('✅ No duplicates found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
