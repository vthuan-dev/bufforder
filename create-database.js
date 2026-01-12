const mysql = require('mysql2/promise');

async function createDatabase() {
  console.log('🔗 Connecting to MySQL (XAMPP)...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '' // XAMPP default: no password
  });

  try {
    console.log('✅ Connected to MySQL!\n');

    // Create database
    console.log('📝 Creating database "greeting_message"...');
    await connection.query('CREATE DATABASE IF NOT EXISTS greeting_message');
    console.log('✅ Database created!\n');

    // Show databases
    console.log('📊 Available databases:');
    const [databases] = await connection.query('SHOW DATABASES');
    databases.forEach(db => {
      const name = db.Database;
      if (name === 'greeting_message') {
        console.log(`   ✅ ${name} (our database)`);
      } else {
        console.log(`   - ${name}`);
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE CREATED SUCCESSFULLY!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: node setup-database.js');
    console.log('   2. Run: node test-db-connection.js');
    console.log('   3. Run: cd backend && node create-admin.js');
    console.log('\n🎉 Ready to go!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure XAMPP MySQL is running');
    console.error('   2. Check password is correct: 1001');
    console.error('   3. Try connecting via MySQL Workbench first');
  } finally {
    await connection.end();
  }
}

createDatabase();
