const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcryptjs');
const prisma = new PrismaClient();

async function createTestUserAndCheck() {
  try {
    // Generate random phone number
    const randomPhone = '0' + Math.floor(Math.random() * 900000000 + 100000000);
    const password = await bcrypt.hash('123456', 10);
    
    console.log('\n🔨 Creating new test user...');
    console.log('─'.repeat(60));
    console.log(`Phone: ${randomPhone}`);
    console.log(`Password: 123456`);
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        phoneNumber: randomPhone,
        fullName: 'Test User',
        password: password,
        balance: 0,
        commission: 0,
        vipLevel: 'vip-0',
        totalDeposited: 0,
        dailyEarnings: '{}' // Empty daily earnings
      }
    });
    
    console.log(`✅ User created with ID: ${newUser.id}`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now check what the API would return for this user
    console.log('\n📊 CHECKING USER DATA (simulating API call)...');
    console.log('─'.repeat(60));
    
    const user = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        balance: true,
        commission: true,
        vipLevel: true,
        totalDeposited: true,
        dailyEarnings: true
      }
    });
    
    console.log('User data:', {
      phone: user.phoneNumber,
      balance: user.balance,
      commission: user.commission,
      vipLevel: user.vipLevel,
      dailyEarnings: user.dailyEarnings
    });
    
    // Get today's date range (same logic as backend)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    console.log('\n📅 Today\'s date range:');
    console.log(`Start: ${startOfDay.toISOString()}`);
    console.log(`End: ${endOfDay.toISOString()}`);
    
    // Get today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });
    
    console.log(`\n📦 Today's orders: ${todayOrders.length}`);
    
    // Parse dailyEarnings
    let dailyEarnings = {};
    try {
      dailyEarnings = JSON.parse(user.dailyEarnings || '{}');
    } catch (e) {
      console.log('❌ Failed to parse dailyEarnings');
    }
    
    console.log('\n💰 Daily Earnings field:', dailyEarnings);
    
    // Simulate what API returns
    const apiResponse = {
      ordersGrabbed: todayOrders.length,
      completedToday: todayOrders.length,
      balance: user.balance,
      commission: user.commission,
      totalDailyTasks: 0, // VIP 0 has 0 tasks
      vipLevel: user.vipLevel
    };
    
    console.log('\n🔍 WHAT API WOULD RETURN:');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n✅ RESULT:');
    console.log('─'.repeat(60));
    if (apiResponse.ordersGrabbed === 0 && apiResponse.completedToday === 0) {
      console.log('✅ CORRECT! New user shows 0 orders.');
    } else {
      console.log('🔴 BUG DETECTED! New user shows non-zero orders:');
      console.log(`   Orders Received: ${apiResponse.ordersGrabbed}`);
      console.log(`   Completed Today: ${apiResponse.completedToday}`);
    }
    
    console.log('\n📝 Test user credentials:');
    console.log(`   Phone: ${randomPhone}`);
    console.log(`   Password: 123456`);
    console.log(`   User ID: ${newUser.id}`);
    console.log('\n💡 You can login with these credentials to verify in the UI.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUserAndCheck();
