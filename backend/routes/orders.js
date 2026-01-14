const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { getVipLevelByAmount } = require('../config/vipLevels');
const { authenticateToken } = require('../middleware/auth');
const { parseJsonField } = require('../lib/utils');
const { getUserStats, getOrdersPaginated } = require('../lib/optimized-queries'); // ⚡ Optimized queries

// Helpers
function getDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Generate order number: ASH + timestamp + random 3 digits
function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ASH${timestamp.slice(-8)}${random}`;
}

// Get fixed commission per order from VIP level or user override
function resolveCommissionPerOrder(user, vipLevel) {
  const config = parseJsonField(user?.commissionConfig, {});
  if (config.perOrderAmount != null) {
    return Number(config.perOrderAmount);
  }
  return vipLevel?.commissionPerOrder || 0;
}

// Get daily target from VIP level or user override
function resolveDailyTarget(user, vipLevel) {
  const config = parseJsonField(user?.commissionConfig, {});
  if (config.dailyTarget != null) {
    return Number(config.dailyTarget);
  }
  return vipLevel?.dailyTarget || 0;
}

// Simplified: pick daily target from VIP level
function pickDailyTarget(user, vipLevel) {
  const target = resolveDailyTarget(user, vipLevel);
  return { mode: 'fixed', targetTotal: target };
}

// GET /api/orders/stats - Get user order statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: userId,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });

    const completedOrders = todayOrders.filter(order => order.status === 'delivered');
    const totalCommission = completedOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    // Get VIP level info
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    const commissionPerOrder = resolveCommissionPerOrder(user, vipLevel);
    const dailyTarget = resolveDailyTarget(user, vipLevel);
    const numberOfOrders = vipLevel?.numberOfOrders || 100;

    // Today's earned commission from user's dailyEarnings
    const todayKey = getDateKey();
    const dailyEarnings = parseJsonField(user.dailyEarnings, {});
    const isToday = dailyEarnings.dateKey === todayKey;
    const dailyEarningsToday = {
      totalCommission: isToday ? Number(dailyEarnings.totalCommission || 0) : 0,
      ordersCount: isToday ? Number(dailyEarnings.ordersCount || 0) : 0,
      targetTotal: isToday ? Number(dailyEarnings.targetTotal || 0) : 0,
      mode: isToday ? (dailyEarnings.mode || 'auto') : 'auto',
      dateKey: todayKey
    };

    res.json({
      success: true,
      data: {
        commission: user.commission + totalCommission,
        balance: user.balance,
        freezeBalance: user.freezeBalance,
        totalDailyTasks: numberOfOrders,
        completedToday: todayOrders.length,
        ordersGrabbed: todayOrders.length,
        vipLevel: user.vipLevel,
        commissionPerOrder,
        dailyTarget,
        commissionConfig: parseJsonField(user.commissionConfig, {}),
        dailyEarnings: dailyEarningsToday
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching order statistics' });
  }
});

// POST /api/orders/take - Take a new order
router.post('/take', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('[Orders/take] userId from token:', userId);
    
    const clientProduct = req.body?.product;
    const clientRequestId = (req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').toString().trim() || null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('[Orders/take] user found:', user ? 'yes' : 'no');
    
    if (!user) {
      console.log('[Orders/take] User not found for id:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check daily limit
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayOrders = await prisma.order.findMany({
      where: {
        userId: userId,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });

    if (todayOrders.length >= 100) {
      return res.status(400).json({ success: false, message: 'Daily order limit reached (100 orders)' });
    }

    // Get VIP level and commission per order
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    const commissionPerOrder = resolveCommissionPerOrder(user, vipLevel);
    const dailyTarget = resolveDailyTarget(user, vipLevel);

    // Require client to send product
    if (!clientProduct) {
      return res.status(400).json({ success: false, message: 'Product is required' });
    }

    const { id, name, price, brand, category, image } = clientProduct;
    if (!id || !name || !price || !brand || !category || !image) {
      return res.status(400).json({ success: false, message: 'Invalid product payload' });
    }
    if (Number(price) > user.balance) {
      return res.status(400).json({ success: false, message: 'Selected product exceeds current balance' });
    }
    const randomProduct = { id, name, price: Number(price), brand, category, image };

    // Initialize/reset daily earnings for today
    const todayKey = getDateKey();
    let dailyEarnings = parseJsonField(user.dailyEarnings, {});
    if (dailyEarnings.dateKey !== todayKey) {
      const picked = pickDailyTarget(user, vipLevel);
      dailyEarnings = {
        dateKey: todayKey,
        totalCommission: 0,
        ordersCount: 0,
        mode: picked.mode,
        targetTotal: picked.targetTotal
      };
    }

    // Calculate commission with ±10% randomness
    const randomFactor = 0.9 + Math.random() * 0.2;
    let commissionAmount = Math.round(commissionPerOrder * randomFactor * 100) / 100;

    // Hard cap: don't exceed daily target
    const target = Number(dailyEarnings.targetTotal || dailyTarget);
    const already = Number(dailyEarnings.totalCommission || 0);
    const remaining = Math.max(0, target - already);

    if (remaining <= 0) {
      commissionAmount = 0;
    } else if (commissionAmount > remaining) {
      commissionAmount = Math.round(remaining * 100) / 100;
    }

    // Check idempotency key
    if (clientRequestId) {
      const existing = await prisma.order.findFirst({
        where: { userId, clientRequestId }
      });
      if (existing) {
        console.log('[Orders] Duplicate detected via clientRequestId:', clientRequestId);
        return res.json({
          success: true,
          data: {
            newCommission: user.commission,
            newBalance: user.balance,
            newCompletedToday: todayOrders.length,
            newOrdersGrabbed: todayOrders.length,
            selectedProduct: {
              productName: existing.productName,
              productPrice: existing.productPrice,
              commissionAmount: existing.commissionAmount,
              commissionRate: existing.commissionRate,
              brand: existing.brand,
              productId: existing.productId,
              category: existing.category,
              image: existing.image
            },
            order: { id: existing.id, status: existing.status, orderDate: existing.orderDate },
            dailyEarnings
          }
        });
      }
    }

    // Check for same product within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = await prisma.order.findFirst({
      where: {
        userId,
        productId: parseInt(randomProduct.id),
        orderDate: { gte: fiveMinutesAgo }
      }
    });

    if (recentDuplicate) {
      console.log('[Orders] Duplicate detected: same product within 5 minutes');
      return res.json({
        success: true,
        data: {
          newCommission: user.commission,
          newBalance: user.balance,
          newCompletedToday: todayOrders.length,
          newOrdersGrabbed: todayOrders.length,
          selectedProduct: {
            productName: recentDuplicate.productName,
            productPrice: recentDuplicate.productPrice,
            commissionAmount: recentDuplicate.commissionAmount,
            commissionRate: recentDuplicate.commissionRate,
            brand: recentDuplicate.brand,
            productId: recentDuplicate.productId,
            category: recentDuplicate.category,
            image: recentDuplicate.image
          },
          order: { id: recentDuplicate.id, status: recentDuplicate.status, orderDate: recentDuplicate.orderDate },
          dailyEarnings
        }
      });
    }

    // Create order and update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          clientRequestId: clientRequestId || undefined,
          orderNumber: generateOrderNumber(),
          productId: parseInt(randomProduct.id),
          productName: randomProduct.name,
          productPrice: randomProduct.price,
          commissionRate: commissionPerOrder,
          commissionAmount,
          brand: randomProduct.brand,
          category: randomProduct.category,
          image: randomProduct.image,
          status: 'pending',
          orderDate: new Date()
        }
      });

      // Credit user
      const creditedCommission = Math.round(commissionAmount * 0.8 * 100) / 100;
      dailyEarnings.totalCommission = Math.round((dailyEarnings.totalCommission + commissionAmount) * 100) / 100;
      dailyEarnings.ordersCount = (dailyEarnings.ordersCount || 0) + 1;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: creditedCommission },
          commission: { increment: commissionAmount },
          dailyEarnings: JSON.stringify(dailyEarnings)
        }
      });

      return { newOrder, updatedUser };
    });

    // Get updated stats
    const updatedTodayOrders = await prisma.order.findMany({
      where: {
        userId,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });

    // 🔔 Emit new order notification to admins
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admins').emit('order:new', {
          orderId: result.newOrder.id,
          orderNumber: result.newOrder.orderNumber,
          userId: userId,
          userName: user.fullName || user.username,
          productName: randomProduct.name,
          productPrice: randomProduct.price,
          createdAt: result.newOrder.orderDate
        });
        console.log('[Orders] Emitted order:new to admins');
      }
    } catch (emitErr) {
      console.error('[Orders] Failed to emit order:new:', emitErr);
    }

    res.json({
      success: true,
      data: {
        newCommission: result.updatedUser.commission,
        newBalance: result.updatedUser.balance,
        newCompletedToday: updatedTodayOrders.length,
        newOrdersGrabbed: updatedTodayOrders.length,
        selectedProduct: {
          productName: randomProduct.name,
          productPrice: randomProduct.price,
          commissionAmount,
          commissionPerOrder,
          brand: randomProduct.brand,
          productId: parseInt(randomProduct.id),
          category: randomProduct.category,
          image: randomProduct.image
        },
        order: {
          id: result.newOrder.id,
          status: result.newOrder.status,
          orderDate: result.newOrder.orderDate
        },
        dailyEarnings
      }
    });
  } catch (error) {
    console.error('Error taking order:', error);
    res.status(500).json({ success: false, message: 'Error taking order' });
  }
});

// POST /api/orders/complete - Disabled (orders remain pending)
router.post('/complete', authenticateToken, async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Auto-complete disabled. Orders remain pending until admin updates status.'
  });
});

// GET /api/orders/history - Get order history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status, sortBy = 'orderDate', sortOrder = 'desc' } = req.query;

    const where = { userId };
    if (status) where.status = status;

    const allowedSort = ['orderDate', 'productPrice', 'status'];
    const sortField = allowedSort.includes(String(sortBy)) ? String(sortBy) : 'orderDate';
    const sortDir = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortField]: sortDir },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.order.count({ where });

    const items = orders.map(o => ({
      id: o.id,
      productName: o.productName,
      productPrice: o.productPrice,
      commissionAmount: o.commissionAmount,
      image: o.image || '',
      status: o.status,
      orderDate: o.orderDate,
      completedAt: o.completedAt || null
    }));

    res.json({
      success: true,
      data: {
        orders: items,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ success: false, message: 'Error fetching order history' });
  }
});

module.exports = router;
