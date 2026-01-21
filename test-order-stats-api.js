const axios = require('axios');

async function testOrderStatsAPI() {
  try {
    // First, login to get token
    console.log('🔐 Logging in...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      phoneNumber: '0706871283',
      password: '123456' // Default password, adjust if different
    });

    if (!loginRes.data.success) {
      console.log('❌ Login failed:', loginRes.data.message);
      return;
    }

    const token = loginRes.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Now call order stats API
    console.log('📊 Fetching order stats...');
    const statsRes = await axios.get('http://localhost:3000/api/orders/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!statsRes.data.success) {
      console.log('❌ Stats API failed:', statsRes.data.message);
      return;
    }

    console.log('✅ Stats API response:');
    console.log('=====================================');
    console.log(JSON.stringify(statsRes.data.data, null, 2));
    console.log('=====================================\n');

    // Check balance specifically
    const balance = statsRes.data.data.balance;
    console.log('💰 Balance from API:', balance);
    
    if (balance === 5000) {
      console.log('✅ API returns correct balance: 5000');
    } else if (balance === 0) {
      console.log('❌ API returns 0 - THIS IS THE BUG!');
    } else {
      console.log(`⚠️  API returns unexpected balance: ${balance}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testOrderStatsAPI();
