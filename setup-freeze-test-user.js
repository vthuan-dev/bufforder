const prisma = require('./backend/lib/prisma');

async function setupTestUser() {
  try {
    // Find user with phone 0706871211
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: '0706871211'
      }
    });

    if (!user) {
      console.log('❌ User not found with phone 0706871211');
      console.log('Creating test user...');
      
      // Create test user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const newUser = await prisma.user.create({
        data: {
          phoneNumber: '0706871211',
          password: hashedPassword,
          fullName: 'Test Freeze User',
          email: 'testfreeze@test.com',
          vipLevel: 'vip-1',
          balance: 10000, // Give enough balance
          totalDeposited: 5000, // VIP 1 level
          commissionConfig: JSON.stringify({}),
          dailyEarnings: JSON.stringify({})
        }
      });
      
      console.log('✅ Created test user:', newUser.fullName);
      console.log('   Phone: 0706871211');
      console.log('   Password: 123456');
      console.log('   Balance: $10,000');
      console.log('   VIP Level: vip-1');
      
      return;
    }

    console.log('\n👤 Found user:', user.fullName);
    console.log('   Phone:', user.phoneNumber);
    console.log('   Current VIP:', user.vipLevel);
    console.log('   Current Balance:', user.balance);

    // Get today's date key
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Create 30 fake orders for today
    console.log('\n📦 Creating 30 orders for today...');
    
    const orders = [];
    for (let i = 0; i < 30; i++) {
      orders.push({
        userId: user.id,
        orderNumber: `TEST${Date.now()}${i}`,
        productId: 1,
        productName: `Test Product ${i + 1}`,
        productPrice: 100,
        brand: 'Test Brand',
        category: 'Test',
        image: 'https://via.placeholder.com/150',
        commissionAmount: 0.45, // VIP 1: 0.5% * 0.9 = 0.45%
        commissionRate: 0.005,
        status: 'completed',
        orderDate: new Date(),
        completedAt: new Date()
      });
    }

    await prisma.order.createMany({
      data: orders
    });

    console.log('✅ Created 30 orders');

    // Update user's dailyEarnings to reflect 30 orders
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyEarnings: JSON.stringify({
          dateKey: todayKey,
          totalCommission: 13.5, // 30 * 0.45
          ordersCount: 30,
          numberOfOrders: 60, // VIP 1 default
          targetTotal: 270 // VIP 1 daily target
        }),
        // Make sure user is VIP 1
        vipLevel: 'vip-1',
        // Give enough balance to continue ordering
        balance: 10000
      }
    });

    console.log('\n✅ Setup complete!');
    console.log('\n📊 User Status:');
    console.log('   Orders today: 30 / 60');
    console.log('   Commission earned: $13.50');
    console.log('   Balance: $10,000');
    console.log('   VIP Level: vip-1');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Login with phone: 0706871211');
    console.log('   2. Password: 123456 (if new user)');
    console.log('   3. Take 5-10 more orders');
    console.log('   4. Account will freeze at order 30-40 (random)');
    console.log('\n⚠️  Note: Freeze trigger is random between 30-40 orders');
    console.log('   You may need to take a few more orders to trigger it!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUser();
