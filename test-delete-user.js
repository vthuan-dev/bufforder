const fetch = require('node-fetch');

async function testDeleteUser() {
  try {
    // First, login as admin to get token
    console.log('Logging in as admin...');
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

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }

    const token = loginData.data.token;
    console.log('Admin token:', token);

    // Get list of users first
    console.log('Getting users list...');
    const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const usersData = await usersResponse.json();
    console.log('Users response:', usersData);

    if (usersData.success && usersData.data.users.length > 0) {
      const firstUser = usersData.data.users[0];
      console.log('Attempting to delete user:', firstUser._id);

      // Try to delete the first user
      const deleteResponse = await fetch(`http://localhost:5000/api/admin/users/${firstUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const deleteData = await deleteResponse.json();
      console.log('Delete response:', deleteData);
    } else {
      console.log('No users found to delete');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testDeleteUser();
