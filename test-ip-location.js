/**
 * Test IP Location Backend Endpoint
 * 
 * This script tests the /api/admin/my-location endpoint
 * to ensure it returns proper location data.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

async function testIpLocation() {
  console.log('🧪 Testing IP Location Endpoint...\n');
  console.log(`API Base: ${API_BASE}\n`);

  try {
    console.log('📡 Calling /api/admin/my-location...');
    const response = await fetch(`${API_BASE}/api/admin/my-location`);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('❌ Request failed!');
      return;
    }

    const data = await response.json();
    console.log('\n📦 Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data) {
      const loc = data.data;
      console.log('\n✅ Location Data:');
      console.log(`   City: ${loc.city || 'N/A'}`);
      console.log(`   Region: ${loc.regionName || 'N/A'}`);
      console.log(`   Country: ${loc.country || 'N/A'}`);
      console.log(`   Coordinates: ${loc.lat || 0}, ${loc.lon || 0}`);
      console.log(`   Status: ${loc.status || 'N/A'}`);

      if (loc.city === 'Local') {
        console.log('\n⚠️  Localhost detected - this is expected when testing locally');
      } else {
        console.log('\n✅ Real location detected!');
        const address = [loc.city, loc.regionName, loc.country]
          .filter(Boolean)
          .join(', ');
        console.log(`   Full Address: ${address}`);
      }
    } else {
      console.error('\n❌ Invalid response format');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testIpLocation().then(() => {
  console.log('\n✅ Test completed');
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
