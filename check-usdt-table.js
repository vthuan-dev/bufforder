// Check if UsdtWallet table exists in production database
const mysql = require('mysql2/promise');

async function checkTable() {
  console.log('🔍 Checking if UsdtWallet table exists...\n');

  // You need to update these credentials for your VPS
  const connection = await mysql.createConnection({
    host: 'localhost', // or your VPS IP
    user: 'root',
    password: '', // your MySQL password
    database: 'greeting_message'
  });

  try {
    // Check if table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'UsdtWallet'"
    );

    if (tables.length > 0) {
      console.log('✅ UsdtWallet table EXISTS');
      
      // Show table structure
      const [columns] = await connection.execute(
        "DESCRIBE UsdtWallet"
      );
      console.log('\n📋 Table structure:');
      console.table(columns);

      // Count rows
      const [count] = await connection.execute(
        "SELECT COUNT(*) as count FROM UsdtWallet"
      );
      console.log(`\n📊 Total wallets: ${count[0].count}`);

    } else {
      console.log('❌ UsdtWallet table DOES NOT EXIST');
      console.log('\n💡 You need to run the migration:');
      console.log('   mysql -u root -p greeting_message < backend/migrations/add_usdt_wallets.sql');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTable();
