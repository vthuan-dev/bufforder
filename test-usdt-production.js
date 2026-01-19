// Test USDT Wallets API on production
const API_BASE = 'https://ashfordorder.com/api';

async function testProduction() {
  console.log('🧪 Testing USDT Wallets on Production...\n');

  try {
    // 1. Login first
    console.log('1️⃣ Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '0123456789', // Replace with your test account
        password: 'password123'
      })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status);
      const data = await loginRes.json();
      console.error('Error:', data);
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    console.log('✅ Login successful');
    console.log('Token:', token?.substring(0, 20) + '...\n');

    // 2. Test GET /api/usdt-wallets
    console.log('2️⃣ Testing GET /api/usdt-wallets...');
    const getRes = await fetch(`${API_BASE}/usdt-wallets`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', getRes.status);
    const getData = await getRes.json();
    console.log('Response:', JSON.stringify(getData, null, 2));

    if (getRes.ok) {
      console.log('✅ GET /api/usdt-wallets works!');
    } else {
      console.error('❌ GET /api/usdt-wallets failed');
      console.error('This might mean:');
      console.error('  - Database table "UsdtWallet" does not exist');
      console.error('  - Migration not run on production');
      console.error('  - Backend route not properly registered');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProduction();
