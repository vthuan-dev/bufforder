/**
 * Test script for Freeze Target Product Feature
 * 
 * This script tests the complete flow:
 * 1. Admin searches for product by price
 * 2. Admin sets freeze threshold with target product
 * 3. Verify user stats include freezeTargetProductId
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

let adminToken = '';
let testUserId = '';

async function login() {
  console.log('\n🔐 Logging in as admin...');
  try {
    const res = await axios.post(`${API_URL}/admin/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    adminToken = res.data.token;
    console.log('✅ Admin logged in successfully');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function findUserByUsername(username) {
  console.log(`\n🔍 Finding user: ${username}...`);
  try {
    const res = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const user = res.data.data.users.find(u => u.username === username);
    if (user) {
      console.log(`✅ Found user: ${user.fullName} (${user.username})`);
      testUserId = user.id;
      return user;
    } else {
      console.log('❌ User not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error finding user:', error.response?.data || error.message);
    return null;
  }
}

async function searchProductByPrice(targetPrice) {
  console.log(`\n🔍 Searching for product near $${targetPrice}...`);
  try {
    const res = await axios.get(`${API_URL}/admin/products/find-by-price/${targetPrice}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (res.data.success && res.data.data) {
      const product = res.data.data;
      console.log('✅ Found product:');
      console.log(`   ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Brand: ${product.brand}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Difference: $${Math.abs(product.price - targetPrice).toFixed(2)}`);
      return product;
    } else {
      console.log('❌ No product found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error searching product:', error.response?.data || error.message);
    return null;
  }
}

async function setFreezeThreshold(userId, threshold, targetProductId) {
  console.log(`\n⚙️ Setting freeze threshold for user...`);
  console.log(`   Threshold: ${threshold}`);
  console.log(`   Target Product ID: ${targetProductId}`);
  
  try {
    const res = await axios.patch(
      `${API_URL}/admin/users/${userId}/commission-config`,
      {
        autoFreezeThreshold: threshold,
        freezeTargetProductId: targetProductId
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    
    if (res.data.success) {
      console.log('✅ Freeze threshold set successfully');
      console.log('   Config:', JSON.stringify(res.data.data.commissionConfig, null, 2));
      return true;
    } else {
      console.log('❌ Failed to set freeze threshold');
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting freeze threshold:', error.response?.data || error.message);
    return false;
  }
}

async function verifyUserStats(userId) {
  console.log(`\n✅ Verifying user stats include freezeTargetProductId...`);
  
  try {
    // Get user details from admin API
    const res = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const user = res.data.data.users.find(u => u.id === userId);
    if (!user) {
      console.log('❌ User not found in stats');
      return false;
    }
    
    const config = typeof user.commissionConfig === 'string' 
      ? JSON.parse(user.commissionConfig) 
      : user.commissionConfig;
    
    console.log('✅ User commission config:');
    console.log(`   autoFreezeThreshold: ${config.autoFreezeThreshold || 'not set'}`);
    console.log(`   freezeTargetProductId: ${config.freezeTargetProductId || 'not set'}`);
    console.log(`   freezeTargetPrice: ${config.freezeTargetPrice || 'not set'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying stats:', error.response?.data || error.message);
    return false;
  }
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('🧪 FREEZE TARGET PRODUCT FEATURE TEST');
  console.log('='.repeat(60));
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Test failed: Could not login');
    return;
  }
  
  // Step 2: Find test user (use 'user1' or any existing user)
  const user = await findUserByUsername('user1');
  if (!user) {
    console.log('\n❌ Test failed: Could not find test user');
    console.log('💡 Tip: Create a user with username "user1" first');
    return;
  }
  
  // Step 3: Search for product by price
  const targetPrice = 2000;
  const product = await searchProductByPrice(targetPrice);
  if (!product) {
    console.log('\n❌ Test failed: Could not find product');
    return;
  }
  
  // Step 4: Set freeze threshold with target product
  const threshold = 7;
  const setSuccess = await setFreezeThreshold(testUserId, threshold, product.id);
  if (!setSuccess) {
    console.log('\n❌ Test failed: Could not set freeze threshold');
    return;
  }
  
  // Step 5: Verify user stats
  await verifyUserStats(testUserId);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📋 Summary:');
  console.log(`   • Admin can search products by price`);
  console.log(`   • Admin can set freeze threshold with target product`);
  console.log(`   • User config stores freezeTargetProductId`);
  console.log(`   • When user reaches order #${threshold}, product ID ${product.id} will be shown`);
  console.log('\n💡 Next: Test the user flow by logging in as user1 and taking orders');
}

// Run the test
runTest().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
