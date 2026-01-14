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
 * Get dashboard stats (parallel queries with error handling)
 */
async function getDashboardStats() {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Yesterday for trend calculation
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    // Execute all queries in parallel with individual error handling
    const results = await Promise.allSettled([
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
      }),
      prisma.order.aggregate({
        where: { orderDate: { gte: startOfDay, lt: endOfDay } },
        _sum: { commissionAmount: true }
      }),
      // Yesterday stats for trends
      prisma.user.count({
        where: { createdAt: { gte: startOfYesterday, lt: endOfYesterday } }
      }),
      prisma.depositRequest.count({
        where: {
          status: 'approved',
          approvedAt: { gte: startOfYesterday, lt: endOfYesterday }
        }
      }),
      prisma.depositRequest.aggregate({
        where: {
          status: 'approved',
          approvedAt: { gte: startOfYesterday, lt: endOfYesterday }
        },
        _sum: { amount: true }
      }),
      prisma.order.aggregate({
        where: { orderDate: { gte: startOfYesterday, lt: endOfYesterday } },
        _sum: { commissionAmount: true }
      })
    ]);

    // Safely extract values with defaults
    const getValue = (result, defaultValue = 0) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      console.warn('Dashboard query failed:', result.reason);
      return defaultValue;
    };

    const totalUsers = getValue(results[0], 0);
    const activeUsers = getValue(results[1], 0);
    const pendingDeposits = getValue(results[2], 0);
    const todayDeposits = getValue(results[3], 0);
    const todayDepositAmount = getValue(results[4], { _sum: { amount: 0 } });
    const totalOrders = getValue(results[5], 0);
    const todayOrders = getValue(results[6], 0);
    const todayCommission = getValue(results[7], { _sum: { commissionAmount: 0 } });
    const yesterdayUsers = getValue(results[8], 0);
    const yesterdayDeposits = getValue(results[9], 0);
    const yesterdayAmount = getValue(results[10], { _sum: { amount: 0 } });
    const yesterdayCommission = getValue(results[11], { _sum: { commissionAmount: 0 } });

    // Calculate trends (percentage change from yesterday)
    let todayNewUsers = 0;
    try {
      todayNewUsers = await prisma.user.count({
        where: { createdAt: { gte: startOfDay, lt: endOfDay } }
      });
    } catch (e) {
      console.warn('Failed to get today new users:', e);
    }

    const calcTrend = (today, yesterday) => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return Math.round(((today - yesterday) / yesterday) * 100);
    };

    return {
      totalUsers,
      activeUsers,
      pendingDeposits,
      todayDeposits,
      todayAmount: todayDepositAmount?._sum?.amount || 0,
      todayCommission: todayCommission?._sum?.commissionAmount || 0,
      totalOrders,
      todayOrders,
      // Trends
      totalUsersTrend: calcTrend(todayNewUsers, yesterdayUsers),
      activeUsersTrend: 0, // Active users trend is complex, set to 0
      todayDepositsTrend: calcTrend(todayDeposits, yesterdayDeposits),
      todayAmountTrend: calcTrend(todayDepositAmount?._sum?.amount || 0, yesterdayAmount?._sum?.amount || 0),
      todayCommissionTrend: calcTrend(todayCommission?._sum?.commissionAmount || 0, yesterdayCommission?._sum?.commissionAmount || 0)
    };
  } catch (error) {
    console.error('getDashboardStats critical error:', error);
    // Return safe defaults to prevent API crash
    return {
      totalUsers: 0,
      activeUsers: 0,
      pendingDeposits: 0,
      todayDeposits: 0,
      todayAmount: 0,
      todayCommission: 0,
      totalOrders: 0,
      todayOrders: 0,
      totalUsersTrend: 0,
      activeUsersTrend: 0,
      todayDepositsTrend: 0,
      todayAmountTrend: 0,
      todayCommissionTrend: 0
    };
  }
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
