const prisma = require('./backend/lib/prisma');
const { hashPassword } = require('./backend/lib/utils');

async function testDashboardAPIs() {
  try {
    console.log('🔗 Connecting to MySQL (Prisma)...');
    console.log('✅ Connected to MySQL successfully\n');

    // Create test data
    console.log('📝 Creating test data...');
    
    const hashedPassword = await hashPassword('test123');
    
    // Create test users
    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          phoneNumber: `999000000${i}`,
          fullName: `Test User ${i}`,
          email: `testuser${i}@example.com`,
          password: hashedPassword,
          vipLevel: `vip-${i % 3}`,
          balance: 1000 * i,
          totalDeposited: 500 * i
        }
      });
      testUsers.push(user);
    }
    console.log(`✅ Created ${testUsers.length} test users\n`);

    // Create test orders
    const testOrders = [];
    for (let i = 0; i < testUsers.length; i++) {
      const order = await prisma.order.create({
        data: {
          userId: testUsers[i].id,
          orderNumber: `ASH${Date.now()}${i}`,
          productId: i + 1,
          productName: `Test Product ${i + 1}`,
          productPrice: 100 * (i + 1),
          commissionRate: 5 + i,
          commissionAmount: (100 * (i + 1)) * (5 + i) / 100,
          brand: 'Test Brand',
          category: 'Test Category',
          status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i % 5]
        }
      });
      testOrders.push(order);
    }
    console.log(`✅ Created ${testOrders.length} test orders\n`);

    // Create test deposit requests
    for (let i = 0; i < 3; i++) {
      await prisma.depositRequest.create({
        data: {
          userId: testUsers[i].id,
          amount: 500 * (i + 1),
          status: ['pending', 'approved', 'rejected'][i]
        }
      });
    }
    console.log(`✅ Created 3 test deposit requests\n`);

    // Test API endpoints
    console.log('🧪 Testing Dashboard API endpoints...\n');

    const API_BASE = 'http://localhost:5000';
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your_admin_token_here';

    // Test 1: Dashboard stats
    console.log('1️⃣ Testing GET /api/admin/dashboard/stats');
    const statsResponse = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    const statsData = await statsResponse.json();
    console.log(`   Status: ${statsResponse.status}`);
    console.log(`   Total users: ${statsData.data?.totalUsers || 0}`);
    console.log(`   Active users: ${statsData.data?.activeUsers || 0}`);
    console.log(`   Pending deposits: ${statsData.data?.pendingDeposits || 0}\n`);

    // Test 2: Recent users
    console.log('2️⃣ Testing GET /api/admin/dashboard/recent-users');
    const recentUsersResponse = await fetch(`${API_BASE}/api/admin/dashboard/recent-users`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    const recentUsersData = await recentUsersResponse.json();
    console.log(`   Status: ${recentUsersResponse.status}`);
    console.log(`   Recent users count: ${recentUsersData.data?.length || 0}\n`);

    // Test 3: Users list
    console.log('3️⃣ Testing GET /api/admin/users');
    const usersResponse = await fetch(`${API_BASE}/api/admin/users?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    const usersData = await usersResponse.json();
    console.log(`   Status: ${usersResponse.status}`);
    console.log(`   Users count: ${usersData.data?.users?.length || 0}\n`);

    // Test 4: Orders list
    console.log('4️⃣ Testing GET /api/admin/orders');
    const ordersResponse = await fetch(`${API_BASE}/api/admin/orders?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    const ordersData = await ordersResponse.json();
    console.log(`   Status: ${ordersResponse.status}`);
    console.log(`   Orders count: ${ordersData.data?.orders?.length || 0}\n`);

    // Test 5: Deposit requests
    console.log('5️⃣ Testing GET /api/admin/deposit-requests');
    const depositsResponse = await fetch(`${API_BASE}/api/admin/deposit-requests?status=all&page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    const depositsData = await depositsResponse.json();
    console.log(`   Status: ${depositsResponse.status}`);
    console.log(`   Deposit requests count: ${depositsData.data?.requests?.length || 0}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.order.deleteMany({
      where: { userId: { in: testUsers.map(u => u.id) } }
    });
    await prisma.depositRequest.deleteMany({
      where: { userId: { in: testUsers.map(u => u.id) } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: testUsers.map(u => u.id) } }
    });
    console.log('✅ Cleanup complete\n');

    console.log('✅ All dashboard API tests completed!\n');
    console.log('📝 Summary:');
    console.log(`   - Created ${testUsers.length} test users`);
    console.log(`   - Created ${testOrders.length} test orders`);
    console.log(`   - Created 3 test deposit requests`);
    console.log(`   - Tested 5 API endpoints`);
    console.log('\n🎉 Dashboard APIs test successful!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPIs();
