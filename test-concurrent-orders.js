const axios = require('axios');

async function testConcurrentOrders() {
  console.log('🧪 Testing Concurrent Order Prevention...\n');
  
  // TODO: Thay YOUR_TOKEN_HERE bằng token thật từ browser DevTools
  const token = 'YOUR_TOKEN_HERE';
  const idempotencyKey = `test-${Date.now()}`;
  
  console.log('📝 Test Configuration:');
  console.log('   - Idempotency Key:', idempotencyKey);
  console.log('   - Number of concurrent requests: 10');
  console.log('   - Expected result: Only 1 order created\n');
  
  const requests = Array(10).fill(null).map((_, index) => 
    axios.post('http://localhost:5000/api/orders/take', {
      product: {
        id: '241',
        name: 'iPhone 15 Pro Max',
        price: 1199,
        brand: 'Apple',
        category: 'Smartphones',
        image: 'https://example.com/iphone.jpg'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-idempotency-key': idempotencyKey,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      console.log(`✅ Request ${index + 1} completed`);
      return response;
    }).catch(error => {
      console.log(`❌ Request ${index + 1} failed:`, error.message);
      throw error;
    })
  );
  
  try {
    console.log('🚀 Sending 10 concurrent requests...\n');
    const results = await Promise.all(requests);
    
    console.log('\n📊 Results:');
    console.log('   - All requests completed successfully');
    
    // Extract order IDs
    const orderIds = results.map(r => r.data.data.order.id);
    console.log('   - Order IDs returned:', orderIds);
    
    // Check if all returned same order ID
    const uniqueIds = new Set(orderIds);
    console.log('   - Unique order IDs:', uniqueIds.size);
    
    if (uniqueIds.size === 1) {
      console.log('\n✅ TEST PASSED: All requests returned the same order!');
      console.log('   This means duplicate prevention is working correctly.');
    } else {
      console.log('\n❌ TEST FAILED: Multiple orders were created!');
      console.log('   Expected 1 unique order, got', uniqueIds.size);
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Instructions
console.log('═══════════════════════════════════════════════════════════');
console.log('  Concurrent Order Test Script');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📋 Instructions:');
console.log('1. Login to the app in your browser');
console.log('2. Open DevTools → Application → Local Storage');
console.log('3. Find "token" and copy its value');
console.log('4. Replace YOUR_TOKEN_HERE in this file with your token');
console.log('5. Run: node test-concurrent-orders.js\n');
console.log('═══════════════════════════════════════════════════════════\n');

if (process.argv.includes('--run')) {
  testConcurrentOrders();
} else {
  console.log('⚠️  Please update the token first, then run with: node test-concurrent-orders.js --run\n');
}
