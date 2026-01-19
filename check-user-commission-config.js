const prisma = require('./backend/lib/prisma');

async function checkUserConfig() {
  try {
    // Get all VIP 1 users
    const users = await prisma.user.findMany({
      where: {
        vipLevel: 'vip-1'
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        vipLevel: true,
        balance: true,
        totalDeposited: true,
        commissionConfig: true,
        dailyEarnings: true
      }
    });

    console.log('\n📊 VIP 1 Users Commission Config:\n');
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.fullName} (${user.phoneNumber})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   VIP Level: ${user.vipLevel}`);
      console.log(`   Balance: $${user.balance}`);
      console.log(`   Total Deposited: $${user.totalDeposited}`);
      
      // Parse commissionConfig
      let config = {};
      try {
        config = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
      } catch (e) {
        config = user.commissionConfig || {};
      }
      
      console.log(`   Commission Config:`, config);
      
      if (config.numberOfOrders) {
        console.log(`   ⚠️  CUSTOM numberOfOrders: ${config.numberOfOrders} (overrides VIP 1 default of 60)`);
      } else {
        console.log(`   ✅ Using VIP 1 default: 60 orders`);
      }
      
      // Parse dailyEarnings
      let earnings = {};
      try {
        earnings = user.dailyEarnings ? JSON.parse(user.dailyEarnings) : {};
      } catch (e) {
        earnings = user.dailyEarnings || {};
      }
      
      if (earnings.numberOfOrders) {
        console.log(`   📅 Today's snapshot: ${earnings.numberOfOrders} orders (locked for today)`);
      }
      
      console.log('   ---');
    }

    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserConfig();
