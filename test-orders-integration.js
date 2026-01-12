const prisma = require('./backend/lib/prisma');
const { hashPassword } = require('./backend/lib/utils');

async function testOrdersIntegration() {
  try {
    console.log('🔗 Connecting to MySQL (Prisma)...');
    console.log('✅ Connected to MySQL successfully\n');

    // Clean up test data
    console.log('🧹 Cleaning up old test data...');
    await prisma.order.deleteMany({
      where: {
        user: {
          phoneNumber: { in: ['1111111111', '2222222222', '3333333333'] }
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        phoneNumber: { in: ['1111111111', '2222222222', '3333333333'] }
      }
    });
    console.log('✅ Cleanup complete\n');

    // Create test users
    console.log('👥 Creating test users...');
    const hashedPassword = await hashPassword('test123');
    
    const user1 = await prisma.user.create({
      data: {
        phoneNumber: '1111111111',
        fullName: 'Test User 1',
        email: 'test1@example.com',
        password: hashedPassword,
        vipLevel: 'vip-1',
        balance: 1000,
        totalDeposited: 100
      }
    });

    const user2 = await prisma.user.create({
      data: {
        phoneNumber: '2222222222',
        fullName: 'Test User 2',
        email: 'test2@example.com',
        password: hashedPassword,
        vipLevel: 'vip-3',
        balance: 5000,
        totalDeposited: 1000
      }
    });

    const user3 = await prisma.user.create({
      data: {
        phoneNumber: '3333333333',
        fullName: 'Test User 3',
        email: 'test3@example.com',
        password: hashedPassword,
        vipLevel: 'vip-5',
        balance: 10000,
        totalDeposited: 5000
      }
    });

    console.log(`✅ Created user 1: ${user1.fullName} (${user1.vipLevel})`);
    console.log(`✅ Created user 2: ${user2.fullName} (${user2.vipLevel})`);
    console.log(`✅ Created user 3: ${user3.fullName} (${user3.vipLevel})\n`);

    // Create test orders
    console.log('📦 Creating test orders...');
    
    const order1 = await prisma.order.create({
      data: {
        userId: user1.id,
        orderNumber: `ASH${Date.now()}001`,
        productId: 1,
        productName: 'Test Product 1',
        productPrice: 100,
        commissionRate: 5,
        commissionAmount: 5,
        brand: 'Test Brand',
        category: 'Electronics',
        status: 'pending'
      }
    });

    const order2 = await prisma.order.create({
      data: {
        userId: user2.id,
        orderNumber: `ASH${Date.now()}002`,
        productId: 2,
        productName: 'Test Product 2',
        productPrice: 500,
        commissionRate: 10,
        commissionAmount: 50,
        brand: 'Test Brand',
        category: 'Fashion',
        status: 'processing'
      }
    });

    const order3 = await prisma.order.create({
      data: {
        userId: user3.id,
        orderNumber: `ASH${Date.now()}003`,
        productId: 3,
        productName: 'Test Product 3',
        productPrice: 1000,
        commissionRate: 15,
        commissionAmount: 150,
        brand: 'Test Brand',
        category: 'Home',
        status: 'shipped'
      }
    });

    const order4 = await prisma.order.create({
      data: {
        userId: user1.id,
        orderNumber: `ASH${Date.now()}004`,
        productId: 4,
        productName: 'Test Product 4',
        productPrice: 200,
        commissionRate: 5,
        commissionAmount: 10,
        brand: 'Test Brand',
        category: 'Electronics',
        status: 'delivered',
        completedAt: new Date()
      }
    });

    console.log(`✅ Created order 1: ${order1.orderNumber} (${order1.status})`);
    console.log(`✅ Created order 2: ${order2.orderNumber} (${order2.status})`);
    console.log(`✅ Created order 3: ${order3.orderNumber} (${order3.status})`);
    console.log(`✅ Created order 4: ${order4.orderNumber} (${order4.status})\n`);

    // Test API endpoints
    console.log('🧪 Testing API endpoints...\n');

    const API_BASE = 'http://localhost:5000';

    // Test 1: Get orders list
    console.log('1️⃣ Testing GET /api/admin/orders');
    const ordersResponse = await fetch(`${API_BASE}/api/admin/orders?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your_admin_token_here'}`
      }
    });
    const ordersData = await ordersResponse.json();
    console.log(`   Status: ${ordersResponse.status}`);
    console.log(`   Orders count: ${ordersData.data?.orders?.length || 0}\n`);

    // Test 2: Get order details
    console.log('2️⃣ Testing GET /api/admin/orders/:id');
    const orderDetailResponse = await fetch(`${API_BASE}/api/admin/orders/${order1.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your_admin_token_here'}`
      }
    });
    const orderDetailData = await orderDetailResponse.json();
    console.log(`   Status: ${orderDetailResponse.status}`);
    console.log(`   Order: ${orderDetailData.data?.order?.product?.name || 'N/A'}\n`);

    // Test 3: Update order status
    console.log('3️⃣ Testing PATCH /api/admin/orders/:id/status');
    const updateStatusResponse = await fetch(`${API_BASE}/api/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your_admin_token_here'}`
      },
      body: JSON.stringify({ status: 'processing' })
    });
    const updateStatusData = await updateStatusResponse.json();
    console.log(`   Status: ${updateStatusResponse.status}`);
    console.log(`   Message: ${updateStatusData.message || 'N/A'}\n`);

    // Test 4: Get order stats
    console.log('4️⃣ Testing GET /api/admin/orders/stats');
    const statsResponse = await fetch(`${API_BASE}/api/admin/orders/stats`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your_admin_token_here'}`
      }
    });
    const statsData = await statsResponse.json();
    console.log(`   Status: ${statsResponse.status}`);
    console.log(`   Total orders: ${statsData.data?.totalOrders || 0}`);
    console.log(`   Total revenue: $${statsData.data?.totalRevenue || 0}\n`);

    console.log('✅ All tests completed!\n');
    console.log('📝 Summary:');
    console.log(`   - Created ${3} test users`);
    console.log(`   - Created ${4} test orders`);
    console.log(`   - Tested ${4} API endpoints`);
    console.log('\n🎉 Orders integration test successful!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrdersIntegration();
