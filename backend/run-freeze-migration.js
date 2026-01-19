const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env' });

async function runFreezeMigration() {
  console.log('🔧 Running Account Freeze Migration...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'greeting_message',
    multipleStatements: true
  });

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/add_account_freeze.sql'),
      'utf8'
    );

    console.log('📄 Executing migration SQL...');
    await connection.query(migrationSQL);
    console.log('✅ Migration completed successfully!\n');

    // Verify columns were added
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM User WHERE Field IN ('isFrozen', 'frozenBalance', 'frozenAt', 'frozenReason', 'unfrozenAt', 'unfrozenBy')
    `);

    console.log('📊 Verification - New columns:');
    columns.forEach(col => {
      console.log(`   ✅ ${col.Field} (${col.Type})`);
    });

    console.log('\n🎉 Account Freeze mechanism is ready!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runFreezeMigration();
