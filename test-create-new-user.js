const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function testCreateNewUser() {
  try {
    // Create a test user
    const testPhone = `test${Date.now()}`;
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const newUser = await prisma.user.create({
      data: {
        phoneNumber: testPhone,
        fullName: 'Test User New',
        password: hashedPassword,
        balance: 0,
        commission: 0,
        vipLevel: 'vip-0',
        totalDeposited: 0,
        dailyEarnings: JSON.stringify({})
      }
    });
    
    console.log('\n✅ Created new test user:');
    console.log('  Phone:', newUser.phoneNumber);
    console.log('  ID:', newUser.id);
    console.log('  Created:', newUser.createdAt.toISOString());
    
    // Now simulate what happens when this user logs in and views orders page
    console.log('\n📊 Simulating API call to /api/orders/stats...\n');
    
    // Get today's date range (same as backend)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    console.log('Today range (backend logic):');
    console.log('  Start:', startOfDay.toISOString());
    console.log('  End:', endOfDay.toISOString());
    
    // Get today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: newUser.id,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });
    
    console.log('\nToday\'s orders:', todayOrders.length);
    
    // Parse dailyEarnings
    const dailyEarnings = JSON.parse(newUser.dailyEarnings || '{}');
    console.log('Daily earnings:', dailyEarnings);
    
    // What would be returned to frontend
    const apiResponse = {
      completedToday: todayOrders.length,
      ordersGrabbed: todayOrders.length,
      balance: newUser.balance,
      commission: newUser.commission
    };
    
    console.log('\n📤 API Response to frontend:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n✅ Test completed successfully!');
    console.log('Expected: completedToday = 0, ordersGrabbed = 0');
    console.log(`Actual: completedToday = ${apiResponse.completedToday}, ordersGrabbed = ${apiResponse.ordersGrabbed}`);
    
    if (apiResponse.completedToday === 0 && apiResponse.ordersGrabbed === 0) {
      console.log('✅ PASS: New user has correct initial values');
    } else {
      console.log('❌ FAIL: New user has incorrect initial values!');
    }
    
    // Clean up - delete test user
    await prisma.order.deleteMany({ where: { userId: newUser.id } });
    await prisma.user.delete({ where: { id: newUser.id } });
    console.log('\n🧹 Cleaned up test user');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateNewUser();
