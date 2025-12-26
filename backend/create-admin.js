const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const config = require('./config');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    // Get admin info from command line arguments or use defaults
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const email = process.argv[4] || `admin@example.com`;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { username: username },
        { email: email }
      ]
    });
    
    if (existingAdmin) {
      console.log(`❌ Admin with username "${username}" or email "${email}" already exists`);
      console.log('💡 Tip: Use different username/email or delete existing admin first');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      username: username,
      email: email,
      password: password, // This will be hashed automatically
      role: 'super_admin'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Admin Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: super_admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
