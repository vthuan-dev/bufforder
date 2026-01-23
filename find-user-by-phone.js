const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function findUser() {
  try {
    const searchPhone = '45216262';
    
    // Find users with phone containing this pattern
    const users = await prisma.user.findMany({
      where: {
        phoneNumber: {
          contains: searchPhone
        }
      },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        createdAt: true,
        balance: true,
        commission: true
      }
    });

    console.log(`\n🔍 Found ${users.length} users with phone containing "${searchPhone}":\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found. Showing all users instead:\n');
      
      const allUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          phoneNumber: true,
          fullName: true,
          createdAt: true,
          balance: true,
          commission: true
        }
      });
      
      console.log(`📋 Last 10 users:\n`);
      allUsers.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.phoneNumber} - ${user.fullName}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log(`   Balance: ${user.balance}, Commission: ${user.commission}\n`);
      });
    } else {
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.phoneNumber} - ${user.fullName}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log(`   Balance: ${user.balance}, Commission: ${user.commission}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUser();
