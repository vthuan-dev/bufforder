// Test script for Orders API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Mock user data for testing
const testUser = {
  phoneNumber: '0123456789',
  password: '123456',
  fullName: 'Test User',
  email: 'test@example.com'
};

async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API...\n');

    // 1. Register a test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ User registered:', registerResponse.data.message);

    // 2. Login to get token
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      phoneNumber: testUser.phoneNumber,
      password: testUser.password
    });
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');

    // 3. Get order stats
    console.log('\n3. Getting order stats...');
    const statsResponse = await axios.get(`${BASE_URL}/orders/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Order stats:', statsResponse.data.data);

    // 4. Take an order
    console.log('\n4. Taking an order...');
    const takeOrderResponse = await axios.post(`${BASE_URL}/orders/take`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Order taken:', takeOrderResponse.data.data);

    // 5. Get updated stats
    console.log('\n5. Getting updated stats...');
    const updatedStatsResponse = await axios.get(`${BASE_URL}/orders/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Updated stats:', updatedStatsResponse.data.data);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOrdersAPI();
