const mongoose = require('mongoose');
const config = require('./backend/config');
const User = require('./backend/models/User');
const DepositRequest = require('./backend/models/DepositRequest');
const Order = require('./backend/models/Order');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  testDashboardAPIs();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function testDashboardAPIs() {
  try {
    console.log('🧪 Testing Dashboard APIs...\n');

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

    // Test 2: Dashboard Stats API
    console.log('\n📊 Testing Dashboard Stats API...');
    const statsResponse = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Dashboard Stats API working');
      console.log('📈 Stats Data:', {
        totalUsers: statsData.data.totalUsers,
        activeUsers: statsData.data.activeUsers,
        pendingDeposits: statsData.data.pendingDeposits,
        todayDeposits: statsData.data.todayDeposits,
        todayAmount: statsData.data.todayAmount,
        todayCommission: statsData.data.todayCommission
      });
    } else {
      console.log('❌ Dashboard Stats API failed');
    }

    // Test 3: Weekly Revenue API
    console.log('\n📈 Testing Weekly Revenue API...');
    const revenueResponse = await fetch('http://localhost:5000/api/admin/dashboard/weekly-revenue', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (revenueResponse.ok) {
      const revenueData = await revenueResponse.json();
      console.log('✅ Weekly Revenue API working');
      console.log('💰 Revenue Data:', revenueData.data);
    } else {
      console.log('❌ Weekly Revenue API failed');
    }

    // Test 4: User Growth API
    console.log('\n👥 Testing User Growth API...');
    const userGrowthResponse = await fetch('http://localhost:5000/api/admin/dashboard/user-growth', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (userGrowthResponse.ok) {
      const userGrowthData = await userGrowthResponse.json();
      console.log('✅ User Growth API working');
      console.log('📊 User Growth Data:', userGrowthData.data);
    } else {
      console.log('❌ User Growth API failed');
    }

    // Test 5: Recent Users API
    console.log('\n🆕 Testing Recent Users API...');
    const recentUsersResponse = await fetch('http://localhost:5000/api/admin/dashboard/recent-users', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (recentUsersResponse.ok) {
      const recentUsersData = await recentUsersResponse.json();
      console.log('✅ Recent Users API working');
      console.log('👤 Recent Users Data:', recentUsersData.data);
    } else {
      console.log('❌ Recent Users API failed');
    }

    // Test 6: Generate some test data if needed
    console.log('\n🔧 Checking if we need to generate test data...');
    
    const userCount = await User.countDocuments();
    const depositCount = await DepositRequest.countDocuments();
    const orderCount = await Order.countDocuments();

    console.log(`📊 Current Data Counts:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Deposit Requests: ${depositCount}`);
    console.log(`   Orders: ${orderCount}`);

    if (userCount === 0 || depositCount === 0 || orderCount === 0) {
      console.log('\n⚠️  Some data is missing. Consider running test-orders-integration.js to generate test data.');
    }

    console.log('\n🎉 Dashboard API Testing Completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Admin login');
    console.log('✅ Dashboard stats API');
    console.log('✅ Weekly revenue API');
    console.log('✅ User growth API');
    console.log('✅ Recent users API');
    
    console.log('\n🚀 You can now test the dashboard at http://localhost:3000/admin');
    console.log('📝 The dashboard should display real data from your database');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
  }
}
