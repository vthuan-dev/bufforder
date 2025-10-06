const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const config = require('./config');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // This will be hashed automatically
      role: 'super_admin'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@example.com');
    console.log('Role: super_admin');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
