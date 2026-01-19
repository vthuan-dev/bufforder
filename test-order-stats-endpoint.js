async function testOrderStatsEndpoint() {
  try {
    // First login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin1234'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    const adminToken = loginData.data.token;
    console.log('✅ Login successful');
    
    // Get user with phone 0706871211
    console.log('\n2. Finding user with phone 0706871211...');
    const usersRes = await fetch('http://localhost:5000/api/admin/users?q=0706871211&limit=1', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const usersData = await usersRes.json();
    if (!usersData.success || !usersData.data.users.length) {
      console.error('❌ User not found');
      return;
    }
    
    const user = usersData.data.users[0];
    console.log('✅ User found:', user.id, user.fullName);
    
    // Test the order-stats endpoint
    console.log('\n3. Testing order-stats endpoint...');
    const statsRes = await fetch(`http://localhost:5000/api/admin/users/${user.id}/order-stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const statsData = await statsRes.json();
    console.log('\n📊 Response:', JSON.stringify(statsData, null, 2));
    
    if (statsData.success) {
      console.log('\n✅ Endpoint working!');
      console.log(`   Today's orders: ${statsData.data.todayOrders}`);
      console.log(`   Date key: ${statsData.data.dateKey}`);
    } else {
      console.error('❌ Endpoint failed:', statsData.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOrderStatsEndpoint();
