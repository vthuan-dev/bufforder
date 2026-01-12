const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔗 Testing MySQL connection...\n');
  
  const config = {
    host: 'localhost',
    user: 'root',
    password: '1001',
    port: 3306
  };

  console.log('📊 Connection details:');
  console.log(`   Host: ${config.host}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Password: ${'*'.repeat(config.password.length)}\n`);

  try {
    // Test connection
    console.log('1️⃣ Connecting to MySQL...');
    const connection = await mysql.createConnection(config);
    console.log('   ✅ Connected successfully!\n');

    // Get MySQL version
    console.log('2️⃣ Getting MySQL version...');
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`   ✅ MySQL Version: ${rows[0].version}\n`);

    // List databases
    console.log('3️⃣ Listing databases...');
    const [databases] = await connection.query('SHOW DATABASES');
    console.log(`   ✅ Found ${databases.length} databases:`);
    databases.forEach(db => {
      const dbName = db.Database || db.database;
      if (dbName === 'greeting_message') {
        console.log(`      - ${dbName} ✅ (target database)`);
      } else {
        console.log(`      - ${dbName}`);
      }
    });

    // Check if greeting_message exists
    const hasGreetingDB = databases.some(db => 
      (db.Database || db.database) === 'greeting_message'
    );

    if (!hasGreetingDB) {
      console.log('\n4️⃣ Creating greeting_message database...');
      await connection.query('CREATE DATABASE greeting_message');
      console.log('   ✅ Database created!\n');
    } else {
      console.log('\n4️⃣ Database greeting_message already exists ✅\n');
    }

    await connection.end();

    console.log('=' .repeat(50));
    console.log('✅ MYSQL CONNECTION TEST PASSED!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: node setup-database.js');
    console.log('   2. Run: node test-db-connection.js');
    console.log('   3. Run: cd backend && node create-admin.js');
    console.log('\n🎉 MySQL is ready!');

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if MySQL is running');
    console.error('   2. Verify password is correct: 1001');
    console.error('   3. Check MySQL port: 3306');
    console.error('   4. Try: mysql -u root -p (then enter password)');
    console.error('\n   If using XAMPP:');
    console.error('   - Start MySQL from XAMPP Control Panel');
    console.error('   - Default password might be empty');
    console.error('\n   If using WAMP:');
    console.error('   - Start MySQL from WAMP menu');
    console.error('   - Default password might be empty or "root"');
    process.exit(1);
  }
}

// Check if mysql2 is installed
try {
  require.resolve('mysql2');
  testConnection();
} catch (e) {
  console.log('❌ mysql2 package not found!\n');
  console.log('📦 Installing mysql2...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install mysql2', { stdio: 'inherit' });
    console.log('\n✅ mysql2 installed! Running test...\n');
    testConnection();
  } catch (err) {
    console.error('❌ Failed to install mysql2');
    console.error('   Please run: npm install mysql2');
    process.exit(1);
  }
}
