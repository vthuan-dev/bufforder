const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function checkWithdrawalMethods() {
  let connection;
  
  try {
    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database
    });

    console.log('🔍 Checking Withdrawal Methods in Database...\n');

    // Check USDT Wallets
    const [usdtWallets] = await connection.execute(`
      SELECT 
        uw.*,
        u.username,
        u.email
      FROM usdtwallet uw
      JOIN user u ON uw.userId = u.id
      ORDER BY uw.createdAt DESC
    `);

    console.log('💜 USDT WALLETS:');
    console.log('================');
    if (usdtWallets.length === 0) {
      console.log('No USDT wallets found\n');
    } else {
      usdtWallets.forEach((wallet, index) => {
        console.log(`\n${index + 1}. ${wallet.walletName}`);
        console.log(`   User: ${wallet.username} (${wallet.email})`);
        console.log(`   Network: ${wallet.network}`);
        console.log(`   Address: ${wallet.walletAddress}`);
        console.log(`   Default: ${wallet.isDefault ? '✅' : '❌'}`);
        console.log(`   Created: ${wallet.createdAt}`);
      });
      console.log(`\nTotal: ${usdtWallets.length} wallets\n`);
    }

    // Check Bank Cards
    const [bankCards] = await connection.execute(`
      SELECT 
        bc.*,
        u.username,
        u.email
      FROM bankcard bc
      JOIN user u ON bc.userId = u.id
      ORDER BY bc.createdAt DESC
    `);

    console.log('💙 BANK CARDS:');
    console.log('==============');
    if (bankCards.length === 0) {
      console.log('No bank cards found\n');
    } else {
      bankCards.forEach((card, index) => {
        console.log(`\n${index + 1}. ${card.bankName}`);
        console.log(`   User: ${card.username} (${card.email})`);
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
    
    const [userSummary] = await connection.execute(`
      SELECT 
        u.username,
        u.email,
        COUNT(DISTINCT uw.id) as usdt_count,
        COUNT(DISTINCT bc.id) as card_count
      FROM user u
      LEFT JOIN usdtwallet uw ON u.id = uw.userId
      LEFT JOIN bankcard bc ON u.id = bc.userId
      WHERE uw.id IS NOT NULL OR bc.id IS NOT NULL
      GROUP BY u.id, u.username, u.email
      ORDER BY (COUNT(DISTINCT uw.id) + COUNT(DISTINCT bc.id)) DESC
    `);

    if (userSummary.length === 0) {
      console.log('No users with withdrawal methods\n');
    } else {
      userSummary.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username} (${user.email})`);
        console.log(`   USDT Wallets: ${user.usdt_count}`);
        console.log(`   Bank Cards: ${user.card_count}`);
      });
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkWithdrawalMethods();
