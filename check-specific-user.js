const prisma = require('./backend/lib/prisma');
const { getVipLevelByAmount } = require('./backend/config/vipLevels');

async function checkUser() {
  try {
    // Get user with phone 0706871222 (from screenshot)
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: '0706871222'
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n👤 User Details:\n');
    console.log(`Name: ${user.fullName}`);
    console.log(`Phone: ${user.phoneNumber}`);
    console.log(`Balance: $${user.balance}`);
    console.log(`Total Deposited: $${user.totalDeposited}`);
    console.log(`VIP Level (stored): ${user.vipLevel}`);
    
    // Calculate actual VIP level based on totalDeposited
    const actualVipLevel = getVipLevelByAmount(user.totalDeposited);
    console.log(`\n🎯 Actual VIP Level (calculated): ${actualVipLevel?.id || 'vip-0'}`);
    console.log(`   Name: ${actualVipLevel?.name || 'N/A'}`);
    console.log(`   Number of Orders: ${actualVipLevel?.numberOfOrders || 0}`);
    console.log(`   Commission Rate: ${(actualVipLevel?.commissionRate || 0) * 100}%`);
    
    // Parse commissionConfig
    let config = {};
    try {
      config = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
    } catch (e) {
      config = user.commissionConfig || {};
    }
    
    console.log(`\n⚙️  Commission Config:`, config);
    
    if (config.numberOfOrders) {
      console.log(`   ⚠️  CUSTOM numberOfOrders: ${config.numberOfOrders}`);
    }
    
    // Parse dailyEarnings
    let earnings = {};
    try {
      earnings = user.dailyEarnings ? JSON.parse(user.dailyEarnings) : {};
    } catch (e) {
      earnings = user.dailyEarnings || {};
    }
    
    console.log(`\n📅 Daily Earnings:`, earnings);
    
    if (earnings.numberOfOrders) {
      console.log(`   📌 Today's snapshot: ${earnings.numberOfOrders} orders`);
    }
    
    // Check if VIP level mismatch
    if (user.vipLevel !== actualVipLevel?.id) {
      console.log(`\n⚠️  VIP LEVEL MISMATCH!`);
      console.log(`   Stored in DB: ${user.vipLevel}`);
      console.log(`   Should be: ${actualVipLevel?.id}`);
      console.log(`   → User needs to be updated to correct VIP level!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
