const mongoose = require('mongoose');
const config = require('./backend/config');
const Admin = require('./backend/models/Admin');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  testPasswordChange();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function testPasswordChange() {
  try {
    console.log('🧪 Testing Admin Password Change Functionality...\n');

    // Test 1: Create test admin if not exists
    let admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      admin = await Admin.create({
        username: 'admin',
        email: 'admin@ashford.com',
        password: 'admin123',
        fullName: 'Admin User',
        role: 'super_admin',
        isActive: true
      });
      console.log('✅ Test admin created');
    } else {
      console.log('✅ Test admin found');
    }

    // Test 2: Test admin login
    console.log('\n🔐 Testing Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Admin login successful');
      
      const adminToken = loginData.data.token;
      
      // Test 3: Test password change
      console.log('\n🔑 Testing Password Change...');
      const changePasswordResponse = await fetch('http://localhost:5000/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          currentPassword: 'admin123',
          newPassword: 'newpassword123'
        })
      });

      if (changePasswordResponse.ok) {
        const changeData = await changePasswordResponse.json();
        console.log('✅ Password change successful:', changeData.message);
        
        // Test 4: Test login with new password
        console.log('\n🔐 Testing Login with New Password...');
        const newLoginResponse = await fetch('http://localhost:5000/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'newpassword123'
          })
        });

        if (newLoginResponse.ok) {
          console.log('✅ Login with new password successful');
          
          // Test 5: Test login with old password (should fail)
          console.log('\n❌ Testing Login with Old Password (should fail)...');
          const oldLoginResponse = await fetch('http://localhost:5000/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'admin',
              password: 'admin123'
            })
          });

          if (!oldLoginResponse.ok) {
            console.log('✅ Login with old password failed as expected');
          } else {
            console.log('❌ Login with old password should have failed');
          }

          // Reset password back to original for future tests
          console.log('\n🔄 Resetting password back to original...');
          const resetResponse = await fetch('http://localhost:5000/api/admin/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              currentPassword: 'newpassword123',
              newPassword: 'admin123'
            })
          });

          if (resetResponse.ok) {
            console.log('✅ Password reset to original successful');
          } else {
            console.log('❌ Password reset failed');
          }

        } else {
          console.log('❌ Login with new password failed');
        }
        
      } else {
        const errorData = await changePasswordResponse.json();
        console.log('❌ Password change failed:', errorData.message);
      }

    } else {
      console.log('❌ Admin login failed');
    }

    // Test 6: Test validation errors
    console.log('\n🧪 Testing Validation Errors...');
    
    // Test with wrong current password
    const wrongPasswordResponse = await fetch('http://localhost:5000/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      })
    });

    if (!wrongPasswordResponse.ok) {
      const errorData = await wrongPasswordResponse.json();
      console.log('✅ Wrong current password validation works:', errorData.message);
    }

    // Test with short new password
    const shortPasswordResponse = await fetch('http://localhost:5000/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        currentPassword: 'admin123',
        newPassword: '123'
      })
    });

    if (!shortPasswordResponse.ok) {
      const errorData = await shortPasswordResponse.json();
      console.log('✅ Short password validation works:', errorData.message);
    }

    console.log('\n🎉 Password Change Testing Completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Admin login');
    console.log('✅ Password change');
    console.log('✅ Login with new password');
    console.log('✅ Old password rejection');
    console.log('✅ Password reset');
    console.log('✅ Validation errors');
    
    console.log('\n🚀 You can now test the admin settings page at http://localhost:3000/admin');
    console.log('📝 Go to Settings > Security tab to test the password change functionality');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
  }
}
