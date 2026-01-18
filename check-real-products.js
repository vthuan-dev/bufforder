const prisma = require('./backend/lib/prisma');

(async () => {
  try {
    const products = await prisma.product.findMany({ take: 10 });
    console.log('\n=== SẢN PHẨM TRONG DATABASE ===');
    console.log('Tổng số sản phẩm:', products.length);
    
    if (products.length > 0) {
      console.log('\nDanh sách sản phẩm:');
      products.forEach(p => {
        console.log(`  ID: ${p.id} - ${p.name} - ${p.price} USD`);
      });
    } else {
      console.log('\n⚠️  KHÔNG CÓ SẢN PHẨM NÀO TRONG DATABASE!');
      console.log('Cần seed products trước khi test orders.');
    }
    
    // Check orders
    const orders = await prisma.order.findMany({ 
      take: 5,
      orderBy: { orderDate: 'desc' }
    });
    
    console.log('\n=== ĐƠN HÀNG GẦN NHẤT ===');
    orders.forEach(o => {
      console.log(`Order ${o.id}: Product ID ${o.productId} - ${o.productName}`);
    });
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
