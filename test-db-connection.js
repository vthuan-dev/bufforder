const prisma = require('./backend/lib/prisma');

async function testConnection() {
  console.log('🔗 Testing MySQL connection with Prisma...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to MySQL successfully!\n');

    // Test query
    console.log('2️⃣ Testing query execution...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ Query successful! Found ${userCount} users\n`);

    // Test admin count
    console.log('3️⃣ Checking admin accounts...');
    const adminCount = await prisma.admin.count();
    console.log(`   ✅ Found ${adminCount} admin accounts\n`);

    // Get database info
    console.log('4️⃣ Database information...');
    const result = await prisma.$queryRaw`SELECT DATABASE() as db_name, VERSION() as version`;
    console.log(`   Database: ${result[0].db_name}`);
    console.log(`   MySQL Version: ${result[0].version}\n`);

    // Test performance
    console.log('5️⃣ Performance test...');
    const start = Date.now();
    
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.depositRequest.count(),
      prisma.withdrawalRequest.count(),
      prisma.chatThread.count()
    ]);
    
    const duration = Date.now() - start;
    console.log(`   ✅ 5 concurrent queries completed in ${duration}ms\n`);

    // Connection pool info
    console.log('6️⃣ Connection pool...');
    console.log('   ✅ Prisma uses connection pooling by default');
    console.log('   ✅ Automatic connection management\n');

    console.log('=' .repeat(50));
    console.log('✅ DATABASE CONNECTION TEST PASSED!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Admins: ${adminCount}`);
    console.log(`   - Query performance: ${duration}ms for 5 queries`);
    console.log('\n🎉 Your database is ready to use!');

  } catch (error) {
    console.error('❌ Connection test failed!\n');
    console.error('Error details:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if MySQL is running: mysql -u root -p');
    console.error('   2. Verify DATABASE_URL in backend/.env');
    console.error('   3. Ensure database exists: CREATE DATABASE greeting_message;');
    console.error('   4. Run migrations: cd backend && npx prisma migrate dev');
    console.error('   5. Generate Prisma Client: cd backend && npx prisma generate');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
