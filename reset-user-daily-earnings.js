const prisma = require('./backend/lib/prisma');

async function resetDailyEarnings() {
  try {
    const user = await prisma.user.update({
      where: {
        phoneNumber: '0706871222'
      },
      data: {
        dailyEarnings: JSON.stringify({})
      }
    });

    console.log('✅ Reset dailyEarnings for user:', user.fullName);
    console.log('   User should now see correct 60 orders limit');
    console.log('   Please refresh the page!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDailyEarnings();
