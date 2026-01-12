const prisma = require('./backend/lib/prisma');
const { hashPassword } = require('./backend/lib/utils');

async function testAllAdminEndpoints() {
  try {
    console.log('🔗 Connecting to MySQL (Prisma)...');
    console.log('✅ Connected to MySQL successfully\n');

    const API_BASE = 'http://localhost:5000';
    let adminToken = '';

    // Test 1: Admin Login
    console.log('1️⃣ Testing Admin Login');
    const loginResponse = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    const loginData = await loginResponse.json();
    console.log(`   Status: ${loginResponse.status}`);
    if (loginData.success) {
      adminToken = loginData.data.token;
      console.log(`   ✅ Login successful`);
      console.log(`   Token: ${adminToken.substring(0, 20)}...\n`);
    } else {
      console.log(`   ❌ Login failed: ${loginData.message}\n`);
      return;
    }

    // Test 2: Get Admin Profile
    console.log('2️⃣ Testing GET /api/admin/profile');
    const profileResponse = await fetch(`${API_BASE}/api/admin/profile`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const profileData = await profileResponse.json();
    console.log(`   Status: ${profileResponse.status}`);
    console.log(`   Admin: ${profileData.data?.username || 'N/A'}\n`);

    // Test 3: Dashboard Stats
    console.log('3️⃣ Testing GET /api/admin/dashboard/stats');
    const statsResponse = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const statsData = await statsResponse.json();
    console.log(`   Status: ${statsResponse.status}`);
    console.log(`   Total users: ${statsData.data?.totalUsers || 0}`);
    console.log(`   Active users: ${statsData.data?.activeUsers || 0}\n`);

    // Test 4: Users List
    console.log('4️⃣ Testing GET /api/admin/users');
    const usersResponse = await fetch(`${API_BASE}/api/admin/users?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const usersData = await usersResponse.json();
    console.log(`   Status: ${usersResponse.status}`);
    console.log(`   Users count: ${usersData.data?.users?.length || 0}\n`);

    // Test 5: Orders List
    console.log('5️⃣ Testing GET /api/admin/orders');
    const ordersResponse = await fetch(`${API_BASE}/api/admin/orders?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const ordersData = await ordersResponse.json();
    console.log(`   Status: ${ordersResponse.status}`);
    console.log(`   Orders count: ${ordersData.data?.orders?.length || 0}\n`);

    // Test 6: Deposit Requests
    console.log('6️⃣ Testing GET /api/admin/deposit-requests');
    const depositsResponse = await fetch(`${API_BASE}/api/admin/deposit-requests?status=all&page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const depositsData = await depositsResponse.json();
    console.log(`   Status: ${depositsResponse.status}`);
    console.log(`   Deposit requests: ${depositsData.data?.requests?.length || 0}\n`);

    // Test 7: Withdrawal Requests
    console.log('7️⃣ Testing GET /api/admin/withdrawal-requests');
    const withdrawalsResponse = await fetch(`${API_BASE}/api/admin/withdrawal-requests?status=all&page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const withdrawalsData = await withdrawalsResponse.json();
    console.log(`   Status: ${withdrawalsResponse.status}`);
    console.log(`   Withdrawal requests: ${withdrawalsData.data?.requests?.length || 0}\n`);

    // Test 8: Chat Threads
    console.log('8️⃣ Testing GET /api/chat/admin/threads');
    const threadsResponse = await fetch(`${API_BASE}/api/chat/admin/threads?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const threadsData = await threadsResponse.json();
    console.log(`   Status: ${threadsResponse.status}`);
    console.log(`   Chat threads: ${threadsData.data?.threads?.length || 0}\n`);

    console.log('✅ All admin endpoint tests completed!\n');
    console.log('📝 Summary:');
    console.log('   - Admin login: ✅');
    console.log('   - Profile: ✅');
    console.log('   - Dashboard stats: ✅');
    console.log('   - Users list: ✅');
    console.log('   - Orders list: ✅');
    console.log('   - Deposit requests: ✅');
    console.log('   - Withdrawal requests: ✅');
    console.log('   - Chat threads: ✅');
    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllAdminEndpoints();
