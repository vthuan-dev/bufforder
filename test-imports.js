// Test if all required functions are properly exported from utils.js

console.log('Testing imports from backend/lib/utils.js...\n');

try {
  const utils = require('./backend/lib/utils.js');
  
  console.log('✅ Successfully imported utils module');
  console.log('\nAvailable exports:');
  console.log('==================');
  
  const requiredFunctions = [
    'hashPassword',
    'comparePassword',
    'excludeFromUser',
    'parseJsonField',
    'getDateKey',
    'getTodayRange',
    'resolveCommissionRate',
    'resolveDailyTarget',
    'resolveNumberOfOrders',
    'resolveAutoFreezeThreshold',
    'getFreezeConfig'
  ];
  
  let allPresent = true;
  
  requiredFunctions.forEach(funcName => {
    if (typeof utils[funcName] === 'function') {
      console.log(`✅ ${funcName}: function`);
    } else if (utils[funcName] !== undefined) {
      console.log(`⚠️  ${funcName}: ${typeof utils[funcName]} (not a function)`);
      allPresent = false;
    } else {
      console.log(`❌ ${funcName}: MISSING`);
      allPresent = false;
    }
  });
  
  console.log('\n==================');
  if (allPresent) {
    console.log('✅ All required functions are present and exported correctly!');
  } else {
    console.log('❌ Some functions are missing or incorrectly exported!');
  }
  
  // Test getDateKey
  console.log('\n📅 Testing getDateKey():');
  const dateKey = utils.getDateKey();
  console.log('   Result:', dateKey);
  
  // Test getTodayRange
  console.log('\n📅 Testing getTodayRange():');
  const range = utils.getTodayRange();
  console.log('   Start:', range.start);
  console.log('   End:', range.end);
  
} catch (error) {
  console.error('❌ Error importing utils:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
}
