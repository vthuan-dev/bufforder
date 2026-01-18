const prisma = require('./backend/lib/prisma');

(async () => {
  try {
    // Delete all orders with productId = 1 (test data)
    const result = await prisma.order.deleteMany({
      where: {
        productId: 1
      }
    });
    
    console.log(`\n✅ Đã xóa ${result.count} orders test (Product ID = 1)`);
    
    // Show remaining orders
    const remaining = await prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      take: 10
    });
    
    console.log(`\nCòn lại ${remaining.length} orders:`);
    remaining.forEach(o => {
      console.log(`  Order ${o.id}: Product ID ${o.productId} - ${o.productName} - ${o.orderDate.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
