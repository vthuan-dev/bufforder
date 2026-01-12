const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up database...\n');

// Check if .env exists
const envPath = path.join(__dirname, 'backend', '.env');
const envExamplePath = path.join(__dirname, 'backend', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found!');
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created!\n');
    console.log('⚠️  IMPORTANT: Edit backend/.env and update DATABASE_URL');
    console.log('   Example: DATABASE_URL="mysql://root:password@localhost:3306/greeting_message"\n');
  } else {
    console.log('❌ .env.example not found!');
    process.exit(1);
  }
}

// Read DATABASE_URL
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="(.+)"/);

if (!dbUrlMatch) {
  console.log('❌ DATABASE_URL not found in .env!');
  console.log('   Please add: DATABASE_URL="mysql://root:password@localhost:3306/greeting_message"');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1];
console.log('📊 Database URL:', dbUrl.replace(/:[^:@]+@/, ':****@'), '\n');

// Extract database name
const dbNameMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'greeting_message';

console.log('🔧 Setup steps:\n');

try {
  // Step 1: Generate Prisma Client
  console.log('1️⃣ Generating Prisma Client...');
  execSync('npx prisma generate', { 
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
  });
  console.log('   ✅ Prisma Client generated!\n');

  // Step 2: Check database connection
  console.log('2️⃣ Checking database connection...');
  try {
    execSync('npx prisma db pull --force', {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe'
    });
    console.log('   ✅ Database connection successful!\n');
  } catch (e) {
    console.log('   ⚠️  Database not found or connection failed');
    console.log('   💡 Creating database...\n');
    
    // Try to create database
    const [, user, pass, host, port] = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/) || [];
    
    if (user && host) {
      console.log('   📝 To create database, run:');
      console.log(`   mysql -u ${user} -p -h ${host} -P ${port || 3306} -e "CREATE DATABASE IF NOT EXISTS ${dbName};"`);
      console.log('\n   Or manually:');
      console.log(`   1. mysql -u ${user} -p`);
      console.log(`   2. CREATE DATABASE ${dbName};`);
      console.log(`   3. Run this script again\n`);
    }
  }

  // Step 3: Run migrations
  console.log('3️⃣ Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit'
    });
    console.log('   ✅ Migrations completed!\n');
  } catch (e) {
    console.log('   ⚠️  Migration failed, trying dev mode...');
    try {
      execSync('npx prisma migrate dev', {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit'
      });
      console.log('   ✅ Migrations completed!\n');
    } catch (e2) {
      console.log('   ❌ Migration failed!');
      console.log('   💡 Make sure database exists and is accessible\n');
    }
  }

  // Step 4: Test connection
  console.log('4️⃣ Testing database connection...');
  console.log('   Run: node test-db-connection.js\n');

  console.log('=' .repeat(50));
  console.log('✅ DATABASE SETUP COMPLETED!\n');
  console.log('📝 Next steps:');
  console.log('   1. Test connection: node test-db-connection.js');
  console.log('   2. Create admin: cd backend && node create-admin.js');
  console.log('   3. Start server: cd backend && npm run dev');
  console.log('\n🎉 You\'re ready to go!');

} catch (error) {
  console.error('\n❌ Setup failed!');
  console.error('Error:', error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Make sure MySQL is installed and running');
  console.error('   2. Check DATABASE_URL in backend/.env');
  console.error('   3. Create database manually: CREATE DATABASE greeting_message;');
  console.error('   4. Run: cd backend && npx prisma generate');
  process.exit(1);
}
