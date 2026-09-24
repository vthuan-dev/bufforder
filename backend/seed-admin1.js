const prisma = require('./lib/prisma');
const { hashPassword } = require('./lib/utils');

async function seedAdmin1() {
  try {
    console.log('🔗 Connecting to database...');

    const username = 'admin1';
    const password = 'admin123';
    const email = 'admin1@example.com';
    const fullName = 'Admin 1';

    console.log('\n📝 Processing admin1 account:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    const hashedPassword = await hashPassword(password);

    if (existingAdmin) {
      console.log('\n⚠️  Admin exists. Updating password & status...');
      const updated = await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          username,
          password: hashedPassword,
          fullName,
          isActive: true
        }
      });
      console.log('✅ Admin1 updated successfully!');
      console.log(`   ID: ${updated.id}`);
      console.log(`   Username: ${updated.username}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('\n✨ Creating new admin1 account...');
      const created = await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
          email,
          fullName,
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Admin1 created successfully!');
      console.log(`   ID: ${created.id}`);
      console.log(`   Username: ${created.username}`);
      console.log(`   Password: ${password}`);
    }

    console.log('\n🎉 Sẵn sàng đăng nhập với tài khoản:');
    console.log(`   👉 Username: ${username}`);
    console.log(`   👉 Password: ${password}\n`);
  } catch (error) {
    console.error('❌ Lỗi khi seed admin1:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seedAdmin1();
