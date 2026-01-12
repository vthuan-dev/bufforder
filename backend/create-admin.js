const prisma = require('./lib/prisma');
const { hashPassword } = require('./lib/utils');

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MySQL (Prisma)...');

    // Get admin info from command line arguments or use defaults
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const email = process.argv[4] || 'admin@example.com';
    const fullName = process.argv[5] || 'System Admin';

    console.log('\n📝 Creating admin with:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Full Name: ${fullName}`);
    console.log(`   Password: ${password}`);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingAdmin) {
      console.log('\n⚠️  Admin already exists with this username or email!');
      console.log(`   Existing admin: ${existingAdmin.username} (${existingAdmin.email})`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        email,
        fullName,
        role: 'admin',
        isActive: true
      }
    });

    console.log('\n✅ Admin created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Full Name: ${admin.fullName}`);
    console.log('\n🎉 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 Usage:');
  console.log('   node create-admin.js [username] [password] [email] [fullName]');
  console.log('\n📝 Examples:');
  console.log('   node create-admin.js');
  console.log('   node create-admin.js admin admin123');
  console.log('   node create-admin.js superadmin pass123 super@admin.com "Super Admin"');
  console.log('\n💡 Default values:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Email: admin@example.com');
  console.log('   Full Name: System Admin\n');
  process.exit(0);
}

createAdmin();
