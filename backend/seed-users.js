/**
 * Seed Users Script
 * Run: node seed-users.js
 */

const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');

const VIP_LEVELS = ['vip-0', 'vip-1', 'vip-2', 'vip-3', 'vip-4', 'vip-5', 'royal-vip', 'svip'];

// Sample Vietnamese names
const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Vo', 'Dang', 'Bui', 'Do'];
const middleNames = ['Van', 'Thi', 'Duc', 'Minh', 'Hoang', 'Thanh', 'Quoc', 'Ngoc', 'Kim', 'Anh'];
const lastNames = ['An', 'Binh', 'Cuong', 'Dung', 'Em', 'Giang', 'Hai', 'Hung', 'Khanh', 'Linh', 'Mai', 'Nam', 'Oanh', 'Phong', 'Quang', 'Son', 'Tuan', 'Uyen', 'Vy', 'Xuan'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
  return `${randomElement(firstNames)} ${randomElement(middleNames)} ${randomElement(lastNames)}`;
}

function generatePhone() {
  const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099', '086', '088', '089'];
  return `${randomElement(prefixes)}${Math.floor(1000000 + Math.random() * 9000000)}`;
}

function generateEmail(name, index) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}${index}@example.com`;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedUsers(count = 50) {
  console.log(`🌱 Seeding ${count} users...`);
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const name = generateName();
    const phone = generatePhone();
    const email = generateEmail(name, i);
    const vipLevel = randomElement(VIP_LEVELS);
    const totalDeposited = Math.floor(Math.random() * 50000);
    const balance = Math.floor(Math.random() * totalDeposited * 0.3);
    const commission = Math.floor(Math.random() * 5000);
    const createdAt = randomDate(thirtyDaysAgo, now);
    
    users.push({
      phoneNumber: phone,
      fullName: name,
      email: email,
      password: hashedPassword,
      vipLevel: vipLevel,
      totalDeposited: totalDeposited,
      balance: balance,
      freezeBalance: 0,
      commission: commission,
      isActive: Math.random() > 0.1, // 90% active
      createdAt: createdAt,
      updatedAt: createdAt
    });
  }
  
  // Insert users
  let created = 0;
  for (const user of users) {
    try {
      await prisma.user.create({ data: user });
      created++;
      process.stdout.write(`\r✅ Created ${created}/${count} users`);
    } catch (err) {
      // Skip duplicates
      if (!err.message.includes('Unique constraint')) {
        console.error(`\n❌ Error creating user: ${err.message}`);
      }
    }
  }
  
  console.log(`\n\n🎉 Successfully seeded ${created} users!`);
  console.log(`📱 Default password for all users: 123456`);
}

async function seedOrders(ordersPerUser = 5) {
  console.log(`\n📦 Seeding orders...`);
  
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    console.log('❌ No users found. Run seedUsers first.');
    return;
  }
  
  const products = [
    { name: 'iPhone 15 Pro Max', price: 1199, brand: 'Apple', category: 'Electronics' },
    { name: 'Samsung Galaxy S24 Ultra', price: 1299, brand: 'Samsung', category: 'Electronics' },
    { name: 'MacBook Pro 16"', price: 2499, brand: 'Apple', category: 'Computers' },
    { name: 'Sony WH-1000XM5', price: 399, brand: 'Sony', category: 'Audio' },
    { name: 'Nike Air Max 90', price: 150, brand: 'Nike', category: 'Fashion' },
    { name: 'Dyson V15 Detect', price: 749, brand: 'Dyson', category: 'Home' },
    { name: 'iPad Pro 12.9"', price: 1099, brand: 'Apple', category: 'Electronics' },
    { name: 'LG OLED TV 65"', price: 1799, brand: 'LG', category: 'Electronics' },
    { name: 'Rolex Submariner', price: 9999, brand: 'Rolex', category: 'Watches' },
    { name: 'Louis Vuitton Bag', price: 2500, brand: 'Louis Vuitton', category: 'Fashion' }
  ];
  
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'delivered', 'delivered']; // More delivered
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let created = 0;
  const totalOrders = users.length * ordersPerUser;
  
  for (const user of users) {
    const numOrders = Math.floor(Math.random() * ordersPerUser) + 1;
    
    for (let i = 0; i < numOrders; i++) {
      const product = randomElement(products);
      const status = randomElement(statuses);
      const orderDate = randomDate(thirtyDaysAgo, now);
      const commissionRate = 0.05 + Math.random() * 0.1; // 5-15%
      
      try {
        await prisma.order.create({
          data: {
            userId: user.id,
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            productId: Math.floor(Math.random() * 1000),
            productName: product.name,
            productPrice: product.price,
            commissionRate: commissionRate,
            commissionAmount: Math.round(product.price * commissionRate * 100) / 100,
            brand: product.brand,
            category: product.category,
            image: `https://picsum.photos/seed/${Math.random()}/400/400`,
            status: status,
            completedAt: status === 'delivered' ? orderDate : null,
            orderDate: orderDate,
            createdAt: orderDate,
            updatedAt: orderDate
          }
        });
        created++;
        process.stdout.write(`\r✅ Created ${created} orders`);
      } catch (err) {
        // Skip errors
      }
    }
  }
  
  console.log(`\n\n🎉 Successfully seeded ${created} orders!`);
}

async function seedDeposits() {
  console.log(`\n💰 Seeding deposit requests...`);
  
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    console.log('❌ No users found.');
    return;
  }
  
  const statuses = ['pending', 'approved', 'approved', 'approved', 'rejected'];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let created = 0;
  
  for (const user of users) {
    const numDeposits = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numDeposits; i++) {
      const status = randomElement(statuses);
      const requestDate = randomDate(thirtyDaysAgo, now);
      const amount = [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)];
      
      try {
        await prisma.depositRequest.create({
          data: {
            userId: user.id,
            amount: amount,
            status: status,
            requestDate: requestDate,
            approvedAt: status !== 'pending' ? requestDate : null,
            rejectionReason: status === 'rejected' ? 'Invalid payment proof' : null,
            createdAt: requestDate,
            updatedAt: requestDate
          }
        });
        created++;
      } catch (err) {
        // Skip errors
      }
    }
  }
  
  console.log(`✅ Created ${created} deposit requests`);
}

async function main() {
  console.log('🚀 Starting seed process...\n');
  
  try {
    // Seed users
    await seedUsers(50);
    
    // Seed orders
    await seedOrders(5);
    
    // Seed deposits
    await seedDeposits();
    
    console.log('\n✨ All done! Database seeded successfully.');
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
