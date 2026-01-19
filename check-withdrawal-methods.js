const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkWithdrawalMethods() {
  try {
    console.log('🔍 Checking Withdrawal Methods in Database...\n');

    // Check USDT Wallets
    const usdtWallets = await prisma.usdtwallet.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    console.log('💜 USDT WALLETS:');
    console.log('================');
    if (usdtWallets.length === 0) {
      console.log('No USDT wallets found\n');
    } else {
      usdtWallets.forEach((wallet, index) => {
        console.log(`\n${index + 1}. ${wallet.walletName}`);
        console.log(`   User: ${wallet.user.username} (${wallet.user.email})`);
        console.log(`   Network: ${wallet.network}`);
        console.log(`   Address: ${wallet.walletAddress}`);
        console.log(`   Default: ${wallet.isDefault ? '✅' : '❌'}`);
        console.log(`   Created: ${wallet.createdAt}`);
      });
      console.log(`\nTotal: ${usdtWallets.length} wallets\n`);
    }

    // Check Bank Cards
    const bankCards = await prisma.bankcard.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    console.log('💙 BANK CARDS:');
    console.log('==============');
    if (bankCards.length === 0) {
      console.log('No bank cards found\n');
    } else {
      bankCards.forEach((card, index) => {
        console.log(`\n${index + 1}. ${card.bankName}`);
        console.log(`   User: ${card.user.username} (${card.user.email})`);
        console.log(`   Card Number: ${card.cardNumber}`);
        console.log(`   Holder: ${card.holderName}`);
        console.log(`   Default: ${card.isDefault ? '✅' : '❌'}`);
        console.log(`   Created: ${card.createdAt}`);
      });
      console.log(`\nTotal: ${bankCards.length} cards\n`);
    }

    // Summary by user
    console.log('📊 SUMMARY BY USER:');
    console.log('===================');
    
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            usdtwallets: true,
            bankcards: true
          }
        }
      },
      where: {
        OR: [
          { usdtwallets: { some: {} } },
          { bankcards: { some: {} } }
        ]
      }
    });

    if (users.length === 0) {
      console.log('No users with withdrawal methods\n');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username} (${user.email})`);
        console.log(`   USDT Wallets: ${user._count.usdtwallets}`);
        console.log(`   Bank Cards: ${user._count.bankcards}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWithdrawalMethods();
