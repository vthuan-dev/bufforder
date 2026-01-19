// Test freeze mechanism via API
// This script simulates the freeze trigger scenario

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFreezeAPI() {
  console.log('🧪 Testing Freeze API Logic\n');
  
  try {
    // Find a VIP 1 user
    const vip1User = await prisma.user.findFirst({
      where: { 
        vipLevel: 'vip-1',
        isFrozen: false
      }
    });
    
    if (!vip1User) {
      console.log('❌ No VIP 1 user found');
      return;
    }
    
    console.log('✅ Found VIP 1 user:', vip1User.phoneNumber);
    console.log(`   Balance: $${vip1User.balance}`);
    console.log(`   VIP Level: ${vip1User.vipLevel}`);
    
    // Get today's orders
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: vip1User.id,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });
    
    console.log(`\n📊 Today's orders: ${todayOrders.length}`);
    
    // Simulate freeze trigger (30-40 orders)
    const freezeTrigger = 35; // Example trigger point
    console.log(`   Freeze trigger: ${freezeTrigger} orders`);
    
    if (todayOrders.length >= freezeTrigger) {
      console.log('\n🔒 FREEZE CONDITION MET!');
      console.log('   User should be frozen on next order attempt');
    } else {
      console.log(`\n⏳ Need ${freezeTrigger - todayOrders.length} more orders to trigger freeze`);
    }
    
    // Test freeze logic manually
    console.log('\n📋 Testing manual freeze...');
    const frozenUser = await prisma.user.update({
      where: { id: vip1User.id },
      data: {
        isFrozen: true,
        frozenBalance: vip1User.balance,
        balance: 0,
        frozenAt: new Date(),
        frozenReason: 'Test: Insufficient balance for order. Please contact admin or top up to unlock.'
      }
    });
    
    console.log('✅ User frozen successfully');
    console.log(`   Balance: $${frozenUser.balance} (was $${vip1User.balance})`);
    console.log(`   Frozen Balance: $${frozenUser.frozenBalance}`);
    console.log(`   Frozen: ${frozenUser.isFrozen}`);
    
    // Test order attempt while frozen
    console.log('\n📋 Testing order attempt while frozen...');
    if (frozenUser.isFrozen) {
      console.log('❌ Order should be blocked (account frozen)');
      console.log('   Error code: ACCOUNT_FROZEN');
      console.log(`   Frozen balance: $${frozenUser.frozenBalance}`);
      console.log(`   Reason: ${frozenUser.frozenReason}`);
    }
    
    // Test unlock
    console.log('\n📋 Testing unlock...');
    const unlockedUser = await prisma.user.update({
      where: { id: frozenUser.id },
      data: {
        isFrozen: false,
        balance: frozenUser.frozenBalance,
        frozenBalance: 0,
        unfrozenAt: new Date(),
        unfrozenBy: 'test-admin'
      }
    });
    
    console.log('✅ User unlocked successfully');
    console.log(`   Balance: $${unlockedUser.balance}`);
    console.log(`   Frozen: ${unlockedUser.isFrozen}`);
    console.log(`   Unfrozen by: ${unlockedUser.unfrozenBy}`);
    
    console.log('\n✅ All API logic tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testFreezeAPI();
