const mongoose = require('mongoose');
const config = require('./backend/config');
const User = require('./backend/models/User');
const Order = require('./backend/models/Order');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  createTestData();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function createTestData() {
  try {
    // Create test users
    const testUsers = await Promise.all([
      User.findOneAndUpdate(
        { email: 'john@example.com' },
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
          vipLevel: 'vip-2',
          balance: 5000,
          totalDeposited: 10000,
          isActive: true
        },
        { upsert: true, new: true }
      ),
      User.findOneAndUpdate(
        { email: 'jane@example.com' },
        {
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          phoneNumber: '+1234567891',
          password: 'password123',
          vipLevel: 'vip-3',
          balance: 8000,
          totalDeposited: 35000,
          isActive: true
        },
        { upsert: true, new: true }
      ),
      User.findOneAndUpdate(
        { email: 'mike@example.com' },
        {
          fullName: 'Mike Johnson',
          email: 'mike@example.com',
          phoneNumber: '+1234567892',
          password: 'password123',
          vipLevel: 'vip-1',
          balance: 2000,
          totalDeposited: 5000,
          isActive: true
        },
        { upsert: true, new: true }
      )
    ]);

    console.log('✅ Test users created:', testUsers.length);

    // Create test orders
    const testOrders = await Promise.all([
      Order.findOneAndUpdate(
        { productId: 1001 },
        {
          userId: testUsers[0]._id,
          productId: 1001,
          productName: 'Luxury Watch Set',
          productPrice: 1250.00,
          commissionRate: 0.5,
          commissionAmount: 6.25,
          brand: 'Rolex',
          category: 'Watches',
          image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
          status: 'processing',
          orderDate: new Date('2025-01-13T10:30:00Z')
        },
        { upsert: true, new: true }
      ),
      Order.findOneAndUpdate(
        { productId: 1002 },
        {
          userId: testUsers[1]._id,
          productId: 1002,
          productName: 'Premium Handbag',
          productPrice: 850.00,
          commissionRate: 0.7,
          commissionAmount: 5.95,
          brand: 'Louis Vuitton',
          category: 'Bags',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
          status: 'shipped',
          orderDate: new Date('2025-01-12T15:20:00Z')
        },
        { upsert: true, new: true }
      ),
      Order.findOneAndUpdate(
        { productId: 1003 },
        {
          userId: testUsers[2]._id,
          productId: 1003,
          productName: 'Designer Shoes',
          productPrice: 450.00,
          commissionRate: 0.3,
          commissionAmount: 1.35,
          brand: 'Nike',
          category: 'Shoes',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
          status: 'delivered',
          completedAt: new Date('2025-01-12T14:30:00Z'),
          orderDate: new Date('2025-01-10T09:15:00Z')
        },
        { upsert: true, new: true }
      ),
      Order.findOneAndUpdate(
        { productId: 1004 },
        {
          userId: testUsers[0]._id,
          productId: 1004,
          productName: 'Jewelry Collection',
          productPrice: 2100.00,
          commissionRate: 0.5,
          commissionAmount: 10.50,
          brand: 'Tiffany',
          category: 'Jewelry',
          image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
          status: 'pending',
          orderDate: new Date('2025-01-13T08:45:00Z')
        },
        { upsert: true, new: true }
      )
    ]);

    console.log('✅ Test orders created:', testOrders.length);

    // Test API endpoints
    console.log('\n🧪 Testing API endpoints...');
    
    // Test admin login
    const adminLoginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (adminLoginResponse.ok) {
      const adminData = await adminLoginResponse.json();
      console.log('✅ Admin login successful');
      
      const adminToken = adminData.data.token;
      
      // Test get orders
      const ordersResponse = await fetch('http://localhost:5000/api/admin/orders?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('✅ Get orders successful:', ordersData.data.orders.length, 'orders found');
      } else {
        console.log('❌ Get orders failed:', ordersResponse.status);
      }

      // Test get order stats
      const statsResponse = await fetch('http://localhost:5000/api/admin/orders/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Get order stats successful:', statsData.data);
      } else {
        console.log('❌ Get order stats failed:', statsResponse.status);
      }

    } else {
      console.log('❌ Admin login failed:', adminLoginResponse.status);
    }

    console.log('\n✅ Test data creation completed!');
    console.log('You can now test the admin orders page at http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}
