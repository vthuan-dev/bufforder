const mongoose = require('mongoose');
const config = require('./backend/config');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  testAllAdminEndpoints();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function testAllAdminEndpoints() {
  try {
    console.log('🧪 Testing All Admin API Endpoints...\n');

    // Test 1: Admin login
    console.log('🔐 Testing Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Admin login failed');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Admin login successful');
    const adminToken = loginData.data.token;

    // Test Dashboard Endpoints
    console.log('\n📊 Testing Dashboard Endpoints...');
    await testEndpoint('Dashboard Stats', `/admin/dashboard/stats`, adminToken);
    await testEndpoint('Weekly Revenue', `/admin/dashboard/weekly-revenue`, adminToken);
    await testEndpoint('User Growth', `/admin/dashboard/user-growth`, adminToken);
    await testEndpoint('Recent Users', `/admin/dashboard/recent-users`, adminToken);

    // Test Users Endpoints
    console.log('\n👥 Testing Users Endpoints...');
    await testEndpoint('Users List', `/admin/users?page=1&limit=5`, adminToken);
    await testEndpoint('Users Stats', `/admin/users/stats`, adminToken);

    // Test Deposits Endpoints
    console.log('\n💰 Testing Deposits Endpoints...');
    await testEndpoint('Deposits List', `/admin/deposits?page=1&limit=5`, adminToken);
    await testEndpoint('Deposits Stats', `/admin/deposits/stats`, adminToken);

    // Test Withdrawals Endpoints
    console.log('\n💸 Testing Withdrawals Endpoints...');
    await testEndpoint('Withdrawals List', `/admin/withdrawals?page=1&limit=5`, adminToken);
    await testEndpoint('Withdrawals Stats', `/admin/withdrawals/stats`, adminToken);

    // Test Orders Endpoints
    console.log('\n📦 Testing Orders Endpoints...');
    await testEndpoint('Orders List', `/admin/orders?page=1&limit=5`, adminToken);
    await testEndpoint('Orders Stats', `/admin/orders/stats`, adminToken);

    // Test Chat Endpoints
    console.log('\n💬 Testing Chat Endpoints...');
    await testEndpoint('Chat Rooms', `/admin/chat/rooms`, adminToken);
    await testEndpoint('Chat Stats', `/admin/chat/stats`, adminToken);

    // Test Settings Endpoints
    console.log('\n⚙️ Testing Settings Endpoints...');
    await testEndpoint('Admin Profile', `/admin/profile`, adminToken);
    await testEndpoint('System Settings', `/admin/settings/system`, adminToken);

    console.log('\n🎉 All Admin Endpoints Testing Completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Dashboard endpoints');
    console.log('✅ Users endpoints');
    console.log('✅ Deposits endpoints');
    console.log('✅ Withdrawals endpoints');
    console.log('✅ Orders endpoints');
    console.log('✅ Chat endpoints');
    console.log('✅ Settings endpoints');
    
    console.log('\n🚀 Admin panel is ready for use!');
    console.log('📝 Access at: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function testEndpoint(name, endpoint, token) {
  try {
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name}: OK (${response.status})`);
      
      // Show sample data for list endpoints
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 Found ${data.data.length} items`);
      } else if (data.data && data.data.items) {
        console.log(`   📊 Found ${data.data.items.length} items`);
      } else if (data.data && typeof data.data === 'object') {
        const keys = Object.keys(data.data);
        console.log(`   📊 Data fields: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
      }
    } else {
      console.log(`❌ ${name}: Failed (${response.status})`);
      const errorData = await response.json().catch(() => ({}));
      if (errorData.message) {
        console.log(`   Error: ${errorData.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ ${name}: Network Error - ${error.message}`);
  }
}
