/**
 * Test VPS IP Location
 * Test IP: 207.148.78.56
 */

async function testVpsIp() {
  const testIp = '207.148.78.56';
  
  console.log('🧪 Testing VPS IP Location...\n');
  console.log(`IP: ${testIp}\n`);

  try {
    // Test with ip-api.com
    console.log('📡 Testing ip-api.com...');
    const res1 = await fetch(`http://ip-api.com/json/${testIp}?fields=status,country,regionName,city,lat,lon,isp,org,as`);
    const data1 = await res1.json();
    
    console.log('\n✅ ip-api.com Response:');
    console.log(JSON.stringify(data1, null, 2));
    
    if (data1.status === 'success') {
      console.log('\n📍 Location Details:');
      console.log(`   City: ${data1.city || 'N/A'}`);
      console.log(`   Region: ${data1.regionName || 'N/A'}`);
      console.log(`   Country: ${data1.country || 'N/A'}`);
      console.log(`   Coordinates: ${data1.lat}, ${data1.lon}`);
      console.log(`   ISP: ${data1.isp || 'N/A'}`);
      console.log(`   Organization: ${data1.org || 'N/A'}`);
      console.log(`   AS: ${data1.as || 'N/A'}`);
      
      const address = [data1.city, data1.regionName, data1.country]
        .filter(Boolean)
        .join(', ');
      console.log(`\n   Full Address: ${address}`);
    }

    // Test with ipapi.co
    console.log('\n\n📡 Testing ipapi.co...');
    const res2 = await fetch(`https://ipapi.co/${testIp}/json/`);
    const data2 = await res2.json();
    
    console.log('\n✅ ipapi.co Response:');
    console.log(JSON.stringify(data2, null, 2));
    
    if (data2.city) {
      console.log('\n📍 Location Details:');
      console.log(`   City: ${data2.city || 'N/A'}`);
      console.log(`   Region: ${data2.region || 'N/A'}`);
      console.log(`   Country: ${data2.country_name || 'N/A'}`);
      console.log(`   Coordinates: ${data2.latitude}, ${data2.longitude}`);
      console.log(`   ISP: ${data2.org || 'N/A'}`);
      
      const address = [data2.city, data2.region, data2.country_name]
        .filter(Boolean)
        .join(', ');
      console.log(`\n   Full Address: ${address}`);
    }

    // Compare results
    console.log('\n\n📊 Comparison:');
    console.log(`   ip-api.com: ${data1.city}, ${data1.regionName}, ${data1.country}`);
    console.log(`   ipapi.co:   ${data2.city}, ${data2.region}, ${data2.country_name}`);
    
    if (data1.city === data2.city) {
      console.log('\n✅ Both services agree on location!');
    } else {
      console.log('\n⚠️  Services show different locations');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run test
testVpsIp().then(() => {
  console.log('\n✅ Test completed');
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
