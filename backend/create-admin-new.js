const prisma = require('./lib/prisma');
const { hashPassword } = require('./lib/utils');

async function createNewAdmin() {
  try {
    console.log('🔗 Connecting to MySQL (Prisma)...');

    // Create new admin with different username
    const username = 'superadmin';
    const password = 'super123';
    const email = 'superadmin@example.com';
    const fullName = 'Super Administrator';

    console.log('\n📝 Creating new admin:');
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
      console.log('\n⚠️  Admin already exists!');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      
      // Update password instead
      console.log('\n🔄 Updating password instead...');
      const hashedPassword = await hashPassword(password);
      
      const updatedAdmin = await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          fullName,
          isActive: true
        }
      });

      console.log('\n✅ Admin password updated successfully!');
      console.log(`   Username: ${updatedAdmin.username}`);
      console.log(`   New Password: ${password}`);
      console.log('\n🎉 You can now login with the new password!');
    } else {
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

      console.log('\n✅ New admin created successfully!');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Full Name: ${admin.fullName}`);
      console.log('\n🎉 You can now login with these credentials!');
    }

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

createNewAdmin();
