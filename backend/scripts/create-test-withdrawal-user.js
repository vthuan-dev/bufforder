const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Create test user for withdrawal testing
    const hashedPassword = await bcrypt.hash('123456', 10);

    const testUser = await prisma.user.upsert({
        where: { phoneNumber: '0999888777' },
        update: {
            balance: 500, // $500 balance
            totalDeposited: 5000, // VIP 1 level (require 5000)
            commission: 100,
        },
        create: {
            phoneNumber: '0999888777',
            password: hashedPassword,
            fullName: 'Test Withdrawal User',
            email: 'testwithdraw@test.com',
            balance: 500, // $500 balance
            totalDeposited: 5000, // VIP 1 level
            commission: 100,
        }
    });

    console.log('Created/Updated test user:', testUser.id);

    // Create a bank card for the user
    const bankCard = await prisma.bankCard.upsert({
        where: {
            id: testUser.id + '-card'  // Use a deterministic ID
        },
        update: {},
        create: {
            id: testUser.id + '-card',
            userId: testUser.id,
            bankName: 'Vietcombank',
            cardNumber: '1234567890123',
            accountName: 'TEST WITHDRAWAL USER',
            isDefault: true,
        }
    });

    console.log('Created/Updated bank card:', bankCard.id);

    // Create 60 orders for today (VIP 1 requires 60 orders)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check existing orders today
    const existingOrders = await prisma.order.count({
        where: {
            userId: testUser.id,
            orderDate: { gte: today }
        }
    });

    console.log('Existing orders today:', existingOrders);

    // Create remaining orders to reach 60
    const ordersNeeded = Math.max(0, 60 - existingOrders);

    if (ordersNeeded > 0) {
        const orders = [];
        for (let i = 0; i < ordersNeeded; i++) {
            orders.push({
                userId: testUser.id,
                orderNumber: `TEST${Date.now()}${i.toString().padStart(4, '0')}`,
                productId: 1,
                productName: `Test Product ${i + 1}`,
                productPrice: 100,
                commissionRate: 0.005, // VIP 1: 0.5%
                commissionAmount: 0.45, // VIP 1: 0.5% * 100 * 0.9 = 0.45
                status: 'delivered',
                orderDate: new Date(),
                completedAt: new Date(),
            });
        }

        await prisma.order.createMany({ data: orders });
        console.log(`Created ${ordersNeeded} orders`);
    }

    // Update dailyEarnings to reflect completed tasks
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await prisma.user.update({
        where: { id: testUser.id },
        data: {
            dailyEarnings: JSON.stringify({
                dateKey,
                ordersCompleted: 60,
                commissionEarned: 27, // 60 * 0.45
                numberOfOrders: 60,
            })
        }
    });

    console.log('Updated dailyEarnings');
    console.log('\n=== TEST ACCOUNT READY ===');
    console.log('Phone: 0999888777');
    console.log('Password: 123456');
    console.log('Balance: $500');
    console.log('VIP Level: VIP 1 (60 orders/day)');
    console.log('Orders completed today: 60/60');
    console.log('Bank Card: Vietcombank - 1234567890123');
    console.log('===========================\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
