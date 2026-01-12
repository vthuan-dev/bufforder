/**
 * Optimized database queries with caching and parallel execution
 */

const prisma = require('./prisma');
const { cached } = require('./cache');

/**
 * Get VIP levels (cached for 1 hour)
 */
async function getVipLevels() {
  return cached('vip:levels', async () => {
    const { VIP_LEVELS } = require('../config/vipLevels');
    return VIP_LEVELS;
  }, 3600); // 1 hour
}

/**
 * Get user with minimal fields (faster)
 */
async function getUserBasic(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phoneNumber: true,
      fullName: true,
      vipLevel: true,
      balance: true,
      commission: true,
      totalDeposited: true,
      isActive: true
    }
  });
}

/**
 * Get user with all relations (when needed)
 */
async function getUserFull(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      bankCards: true
    }
  });
}

/**
 * Get dashboard stats (parallel queries)
 */
async function getDashboardStats() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Execute all queries in parallel
  const [
    totalUsers,
    activeUsers,
    pendingDeposits,
    todayDeposits,
    todayDepositAmount,
    totalOrders,
    todayOrders
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { totalDeposited: { gt: 0 } } }),
    prisma.depositRequest.count({ where: { status: 'pending' } }),
    prisma.depositRequest.count({
      where: {
        status: 'approved',
        approvedAt: { gte: startOfDay, lt: endOfDay }
      }
    }),
    prisma.depositRequest.aggregate({
      where: {
        status: 'approved',
        approvedAt: { gte: startOfDay, lt: endOfDay }
      },
      _sum: { amount: true }
    }),
    prisma.order.count(),
    prisma.order.count({
      where: { orderDate: { gte: startOfDay, lt: endOfDay } }
    })
  ]);

  return {
    totalUsers,
    activeUsers,
    pendingDeposits,
    todayDeposits,
    todayAmount: todayDepositAmount._sum.amount || 0,
    totalOrders,
    todayOrders
  };
}

/**
 * Get orders with pagination (optimized)
 */
async function getOrdersPaginated(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  // Parallel execution
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        productName: true,
        productPrice: true,
        commissionAmount: true,
        image: true,
        status: true,
        orderDate: true
      },
      orderBy: { orderDate: 'desc' },
      take: limit,
      skip
    }),
    prisma.order.count({ where: { userId } })
  ]);

  return {
    orders,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total
    }
  };
}

/**
 * Get user stats (cached for 30 seconds)
 */
async function getUserStats(userId) {
  return cached(`user:stats:${userId}`, async () => {
    const user = await getUserBasic(userId);
    if (!user) return null;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayOrders = await prisma.order.count({
      where: {
        userId,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });

    return {
      ...user,
      todayOrders
    };
  }, 30); // 30 seconds cache
}

/**
 * Batch get users (for admin)
 */
async function getUsersBatch(userIds) {
  return prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      vipLevel: true,
      balance: true
    }
  });
}

module.exports = {
  getVipLevels,
  getUserBasic,
  getUserFull,
  getDashboardStats,
  getOrdersPaginated,
  getUserStats,
  getUsersBatch
};
