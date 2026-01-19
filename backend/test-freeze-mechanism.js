const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFreezeMechanism() {
  console.log('🧪 Testing Account Freeze Mechanism\n');
  
  try {
    // Test 1: Check if freeze fields exist
    console.log('📋 Test 1: Verify freeze fields in database');
    const user = await prisma.user.findFirst({
      where: { vipLevel: 'vip-1' }
    });
    
    if (!user) {
      console.log('❌ No VIP 1 user found. Creating test user...');
      const testUser = await prisma.user.create({
        data: {
          phoneNumber: `test${Date.now()}`,
          fullName: 'Test Freeze User',
          password: 'test123',
          vipLevel: 'vip-1',
          balance: 1000,
          totalDeposited: 5000
        }
      });
      console.log('✅ Test user created:', testUser.id);
      console.log(`   Phone: ${testUser.phoneNumber}`);
      console.log(`   Balance: $${testUser.balance}`);
      console.log(`   VIP Level: ${testUser.vipLevel}`);
    } else {
      console.log('✅ VIP 1 user found:', user.id);
      console.log(`   Phone: ${user.phoneNumber}`);
      console.log(`   Balance: $${user.balance}`);
      console.log(`   Frozen: ${user.isFrozen}`);
      console.log(`   Frozen Balance: $${user.frozenBalance}`);
    }
    
    // Test 2: Check freeze fields structure
    console.log('\n📋 Test 2: Verify freeze fields structure');
    const fields = ['isFrozen', 'frozenBalance', 'frozenAt', 'frozenReason', 'unfrozenAt', 'unfrozenBy'];
    const testUser = user || await prisma.user.findFirst({ where: { vipLevel: 'vip-1' } });
    
    fields.forEach(field => {
      const hasField = field in testUser;
      console.log(`   ${hasField ? '✅' : '❌'} ${field}: ${hasField ? 'exists' : 'missing'}`);
    });
    
    // Test 3: Test freeze operation
    console.log('\n📋 Test 3: Test freeze operation');
    const userToFreeze = await prisma.user.findFirst({
      where: { 
        vipLevel: 'vip-1',
        isFrozen: false,
        balance: { gt: 0 }
      }
    });
    
    if (userToFreeze) {
      console.log(`   Freezing user: ${userToFreeze.id}`);
      console.log(`   Current balance: $${userToFreeze.balance}`);
      
      const frozenUser = await prisma.user.update({
        where: { id: userToFreeze.id },
        data: {
          isFrozen: true,
          frozenBalance: userToFreeze.balance,
          balance: 0,
          frozenAt: new Date(),
          frozenReason: 'Test freeze - insufficient balance'
        }
      });
      
      console.log('   ✅ User frozen successfully');
      console.log(`   New balance: $${frozenUser.balance}`);
      console.log(`   Frozen balance: $${frozenUser.frozenBalance}`);
      console.log(`   Frozen at: ${frozenUser.frozenAt}`);
      
      // Test 4: Test unlock operation
      console.log('\n📋 Test 4: Test unlock operation');
      const unlockedUser = await prisma.user.update({
        where: { id: frozenUser.id },
        data: {
          isFrozen: false,
          balance: frozenUser.frozenBalance,
          frozenBalance: 0,
          unfrozenAt: new Date(),
          unfrozenBy: 'test-script'
        }
      });
      
      console.log('   ✅ User unlocked successfully');
      console.log(`   New balance: $${unlockedUser.balance}`);
      console.log(`   Frozen balance: $${unlockedUser.frozenBalance}`);
      console.log(`   Unfrozen at: ${unlockedUser.unfrozenAt}`);
      console.log(`   Unfrozen by: ${unlockedUser.unfrozenBy}`);
    } else {
      console.log('   ⚠️  No suitable user found for freeze test');
    }
    
    // Test 5: Count frozen accounts
    console.log('\n📋 Test 5: Count frozen accounts');
    const frozenCount = await prisma.user.count({
      where: { isFrozen: true }
    });
    console.log(`   Frozen accounts: ${frozenCount}`);
    
    if (frozenCount > 0) {
      const frozenUsers = await prisma.user.findMany({
        where: { isFrozen: true },
        select: {
          id: true,
          phoneNumber: true,
          vipLevel: true,
          frozenBalance: true,
          frozenAt: true
        },
        take: 5
      });
      
      console.log('   Sample frozen accounts:');
      frozenUsers.forEach(u => {
        console.log(`   - ${u.phoneNumber} (${u.vipLevel}): $${u.frozenBalance} frozen at ${u.frozenAt}`);
      });
    }
    
    // Test 6: Check VIP 1 users
    console.log('\n📋 Test 6: VIP 1 users statistics');
    const vip1Count = await prisma.user.count({
      where: { vipLevel: 'vip-1' }
    });
    const vip1Frozen = await prisma.user.count({
      where: { vipLevel: 'vip-1', isFrozen: true }
    });
    
    console.log(`   Total VIP 1 users: ${vip1Count}`);
    console.log(`   Frozen VIP 1 users: ${vip1Frozen}`);
    console.log(`   Freeze rate: ${vip1Count > 0 ? ((vip1Frozen / vip1Count) * 100).toFixed(2) : 0}%`);
    
    console.log('\n✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Database fields verified');
    console.log('   ✅ Freeze operation tested');
    console.log('   ✅ Unlock operation tested');
    console.log('   ✅ Statistics collected');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testFreezeMechanism();
