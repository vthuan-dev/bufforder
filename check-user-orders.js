const prisma = require('./backend/lib/prisma');

async function checkOrders() {
  try {
    const user = await prisma.user.findFirst({
      where: { phoneNumber: '0706871211' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        orderDate: { gte: startOfDay, lt: endOfDay }
      },
      orderBy: { orderDate: 'asc' }
    });
    
    console.log('👤 User:', user.fullName);
    console.log('📊 Today orders:', todayOrders.length);
    console.log('🎯 Freeze threshold:', 11);
    console.log('📦 Target product ID:', 8502);
    console.log('');
    console.log('Next order will be #' + (todayOrders.length + 1));
    
    if (todayOrders.length + 1 >= 11) {
      console.log('✅ NEXT ORDER WILL TRIGGER TARGET PRODUCT!');
    } else {
      console.log('⏳ Need', 11 - todayOrders.length, 'more orders to reach threshold');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
