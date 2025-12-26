const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const config = require('./config');

async function createNewAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    // Create new admin with different username
    const newAdmin = new Admin({
      username: 'admin2',
      email: 'admin2@example.com',
      password: 'admin123456', // This will be hashed automatically
      role: 'super_admin',
      fullName: 'Admin 2'
    });

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { username: 'admin2' },
        { email: 'admin2@example.com' }
      ]
    });
    
    if (existingAdmin) {
      console.log('❌ Admin with username "admin2" or email "admin2@example.com" already exists');
      console.log('💡 Trying to create admin3 instead...');
      
      // Try admin3
      const existingAdmin3 = await Admin.findOne({ 
        $or: [
          { username: 'admin3' },
          { email: 'admin3@example.com' }
        ]
      });
      
      if (existingAdmin3) {
        console.log('❌ Admin3 also exists. Please delete existing admin or use different username.');
        process.exit(0);
      }
      
      // Create admin3
      const admin3 = new Admin({
        username: 'admin3',
        email: 'admin3@example.com',
        password: 'admin123456',
        role: 'super_admin',
        fullName: 'Admin 3'
      });
      
      await admin3.save();
      
      console.log('✅ Admin user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Admin Credentials:');
      console.log('   Username: admin3');
      console.log('   Password: admin123456');
      console.log('   Email: admin3@example.com');
      console.log('   Role: super_admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      await newAdmin.save();
      
      console.log('✅ Admin user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Admin Credentials:');
      console.log('   Username: admin2');
      console.log('   Password: admin123456');
      console.log('   Email: admin2@example.com');
      console.log('   Role: super_admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.log('💡 Duplicate key error - Admin with this username or email already exists');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createNewAdmin();

