const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { getVipLevelByAmount } = require('../config/vipLevels');
const { authenticateToken } = require('../middleware/auth');
const {
  parseJsonField,
  getDateKey,
  resolveCommissionRate,
  resolveDailyTarget,
  resolveNumberOfOrders,
  getFreezeConfig
} = require('../lib/utils');
const { getUserStats, getOrdersPaginated } = require('../lib/optimized-queries'); // ⚡ Optimized queries

// Generate order number: ASH + timestamp + random 3 digits
function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ASH${timestamp.slice(-8)}${random}`;
}

// Helper to build consistent order response
function buildOrderResponse(order, user, todayOrdersCount, dailyEarnings) {
  return {
    newCommission: user.commission,
    newBalance: user.balance,
    newCompletedToday: todayOrdersCount,
    newOrdersGrabbed: todayOrdersCount,
    selectedProduct: {
      productName: order.productName,
      productPrice: order.productPrice,
      commissionAmount: order.commissionAmount,
      commissionRate: order.commissionRate,
      brand: order.brand,
      productId: order.productId,
      category: order.category,
      image: order.image
    },
    order: {
      id: order.id,
      status: order.status,
      orderDate: order.orderDate
    },
    dailyEarnings
  };
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
    const { start: startOfDay, end: endOfDay } = getTodayRange();

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
    const commissionRate = resolveCommissionRate(user, vipLevel);
    const dailyTarget = resolveDailyTarget(user, vipLevel);
    const numberOfOrders = resolveNumberOfOrders(user, vipLevel);

    // Today's earned commission from user's dailyEarnings
    const todayKey = getDateKey();
    const dailyEarnings = parseJsonField(user.dailyEarnings, {});
    const isToday = dailyEarnings.dateKey === todayKey;
    const dailyEarningsToday = {
      totalCommission: isToday ? Number(dailyEarnings.totalCommission || 0) : 0,
      ordersCount: isToday ? Number(dailyEarnings.ordersCount || 0) : 0,
      targetTotal: isToday ? Number(dailyEarnings.targetTotal || 0) : 0,
      numberOfOrders: isToday ? Number(dailyEarnings.numberOfOrders || 0) : 0,
      mode: isToday ? (dailyEarnings.mode || 'auto') : 'auto',
      dateKey: todayKey
    };

    // Use snapshotted value if exists (user already started grabbing today), otherwise use current config
    const effectiveNumberOfOrders = (isToday && dailyEarnings.numberOfOrders > 0)
      ? dailyEarnings.numberOfOrders
      : numberOfOrders;

    // Calculate freeze threshold for frontend
    let freezeThreshold = null;
    let freezeTargetProductId = null;

    if (user.vipLevel !== 'vip-0' && !user.isFrozen && effectiveNumberOfOrders > 0) {
      const customThreshold = resolveAutoFreezeThreshold(user);
      const commissionConfig = parseJsonField(user.commissionConfig, {});

      if (customThreshold != null && customThreshold > 0) {
        freezeThreshold = customThreshold;
      } else {
        // Use 85% as average for display (actual is random 80-90%)
        freezeThreshold = Math.floor(effectiveNumberOfOrders * 0.85);
      }

      // Get target product ID if admin specified one
      freezeTargetProductId = commissionConfig.freezeTargetProductId || null;
    }

    res.json({
      success: true,
      data: {
        commission: user.commission + totalCommission,
        balance: user.balance,
        freezeBalance: user.freezeBalance,
        totalDailyTasks: effectiveNumberOfOrders,
        completedToday: todayOrders.length,
        ordersGrabbed: todayOrders.length,
        vipLevel: user.vipLevel,
        commissionRate, // Percentage rate (e.g., 0.012 = 1.2%)
        dailyTarget,
        commissionConfig: parseJsonField(user.commissionConfig, {}),
        dailyEarnings: dailyEarningsToday,
        freezeThreshold, // Threshold order number where freeze may trigger
        freezeTargetProductId, // Admin-specified product for freeze
        isFrozen: user.isFrozen,
        frozenReason: user.frozenReason
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
    console.log('[Orders/take] Idempotency key:', clientRequestId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('[Orders/take] user found:', user ? 'yes' : 'no');

    if (!user) {
      console.log('[Orders/take] User not found for id:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get today's date range
    const { start: startOfDay, end: endOfDay } = getTodayRange();

    // Get today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        userId: userId,
        orderDate: { gte: startOfDay, lt: endOfDay }
      }
    });

    // Get VIP level
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    const dailyEarnings = parseJsonField(user.dailyEarnings, {});

    // Get dynamic order limit from user snapshot or VIP level
    const effectiveOrdersLimit = dailyEarnings.numberOfOrders || resolveNumberOfOrders(user, vipLevel);

    if (todayOrders.length >= effectiveOrdersLimit) {
      return res.status(400).json({ success: false, message: `Daily order limit reached (${effectiveOrdersLimit} orders)` });
    }

    // Get commission rate
    const commissionRate = resolveCommissionRate(user, vipLevel);

    // Require client to send product
    if (!clientProduct) {
      return res.status(400).json({ success: false, message: 'Product is required' });
    }

    const { id, name, price, brand, category, image } = clientProduct;
    if (!id || !name || !price || !brand || !category || !image) {
      return res.status(400).json({ success: false, message: 'Invalid product payload' });
    }
    // Note: We allow price > balance at freeze threshold (frontend filters this)
    // Backend will check both conditions: order count + price > balance
    const randomProduct = { id, name, price: Number(price), brand, category, image };

    // ============================================
    // 🔒 FREEZE MECHANISM - ADMIN CONTROLLED ONLY
    // ============================================
    // Freeze ONLY happens when admin explicitly enables it for the user
    // Two modes available:
    // 1. 'random' - Freeze at 80-90% of max orders (random)
    // 2. 'custom' - Freeze at specific order number
    // Applied to all VIP levels (except VIP 0)
    let shouldFreeze = false;
    let freezeTrigger = null;

    if (user.vipLevel !== 'vip-0' && !user.isFrozen && effectiveOrdersLimit > 0) {
      // Get freeze config from admin settings
      const freezeConfig = getFreezeConfig(user);

      // Only proceed if admin has ENABLED freeze for this user
      if (freezeConfig.enabled) {
        if (freezeConfig.mode === 'random') {
          // Random 80-90% of max orders
          const freezePercentMin = 0.80;
          const freezePercentMax = 0.90;
          const randomPercent = freezePercentMin + (Math.random() * (freezePercentMax - freezePercentMin));
          freezeTrigger = Math.floor(effectiveOrdersLimit * randomPercent);
          console.log(`[Orders/take] ${user.vipLevel.toUpperCase()} freeze check: ${todayOrders.length}/${freezeTrigger} orders (RANDOM ${Math.round(randomPercent * 100)}% mode)`);
        } else if (freezeConfig.mode === 'custom' && freezeConfig.threshold != null) {
          // Use admin's custom threshold
          freezeTrigger = freezeConfig.threshold;
          console.log(`[Orders/take] ${user.vipLevel.toUpperCase()} freeze check: ${todayOrders.length}/${freezeTrigger} orders (CUSTOM threshold)`);
        }

        // Check BOTH conditions: order count reached AND product price exceeds balance
        if (freezeTrigger != null) {
          const nextOrderNumber = todayOrders.length + 1;
          const isAtOrPastThreshold = nextOrderNumber >= freezeTrigger;
          const isPriceHighEnough = Number(randomProduct.price) > user.balance;

          console.log(`[Orders/take] Freeze evaluation for User ${user.phoneNumber}:`);
          console.log(`  - Order Number: ${nextOrderNumber}`);
          console.log(`  - Threshold: ${freezeTrigger} (Mode: ${freezeConfig.mode})`);
          console.log(`  - Price: ${randomProduct.price} vs Balance: ${user.balance}`);
          console.log(`  - Condition met: AtThreshold=${isAtOrPastThreshold}, PriceTrigger=${isPriceHighEnough}`);

          if (isAtOrPastThreshold && isPriceHighEnough) {
            shouldFreeze = true;
            console.log('[Orders/take] 🔒 FREEZE TRIGGERED: Conditions met');
          } else if (isAtOrPastThreshold && !isPriceHighEnough) {
            console.log('[Orders/take] ⚠️ Threshold reached but product price too low. Freeze pending for next expensive product.');
          }
        }
      } else {
        console.log(`[Orders/take] ${user.vipLevel.toUpperCase()} - Freeze NOT enabled by admin`);
      }
    }

    // Check if account is frozen
    if (user.isFrozen) {
      return res.status(403).json({
        success: false,
        message: 'Account is frozen',
        error: {
          code: 'ACCOUNT_FROZEN',
          frozenBalance: user.frozenBalance,
          frozenAt: user.frozenAt,
          reason: user.frozenReason || 'Your account is frozen. Please contact admin or top up to unlock.'
        }
      });
    }

    // Initialize/reset daily earnings for today - SNAPSHOT config at first order of day
    const todayKey = getDateKey();
    let currentDailyEarnings = dailyEarnings;
    if (currentDailyEarnings.dateKey !== todayKey) {
      const snapshotNumberOfOrders = resolveNumberOfOrders(user, vipLevel);
      currentDailyEarnings = {
        dateKey: todayKey,
        totalCommission: 0,
        ordersCount: 0,
        numberOfOrders: snapshotNumberOfOrders  // Snapshot at first order of day
      };
    }


    // Calculate commission based on product price and VIP rate
    // This ensures profit is proportional to the item value
    const productPrice = randomProduct.price;
    const commissionAmount = Math.round(productPrice * commissionRate * 0.9 * 100) / 100;

    // ============================================
    // DUPLICATE DETECTION - BEFORE TRANSACTION
    // ============================================

    // Check idempotency key BEFORE transaction
    if (clientRequestId) {
      const existingByKey = await prisma.order.findFirst({
        where: { userId, clientRequestId }
      });
      if (existingByKey) {
        console.log('[Orders/take] ✅ Duplicate detected via idempotency key:', clientRequestId);
        return res.json({
          success: true,
          data: buildOrderResponse(existingByKey, user, todayOrders.length, currentDailyEarnings)
        });
      }
    }

    // Check for same product within last 5 minutes BEFORE transaction
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingByTime = await prisma.order.findFirst({
      where: {
        userId,
        productId: parseInt(randomProduct.id),
        orderDate: { gte: fiveMinutesAgo }
      }
    });

    if (existingByTime) {
      console.log('[Orders/take] ✅ Duplicate detected: same product within 5 minutes, productId:', randomProduct.id);
      return res.json({
        success: true,
        data: buildOrderResponse(existingByTime, user, todayOrders.length, currentDailyEarnings)
      });
    }

    // ============================================
    // CREATE ORDER - START TRANSACTION
    // ============================================

    // Create order and update user in transaction
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // Determine order status based on freeze condition
        const orderStatus = shouldFreeze ? 'suspended' : 'pending';

        const newOrder = await tx.order.create({
          data: {
            userId,
            clientRequestId, // ✅ Store the key directly (not undefined)
            orderNumber: generateOrderNumber(),
            productId: parseInt(randomProduct.id),
            productName: randomProduct.name,
            productPrice: randomProduct.price,
            commissionRate: commissionRate,
            commissionAmount,
            brand: randomProduct.brand,
            category: randomProduct.category,
            image: randomProduct.image,
            status: orderStatus, // 'suspended' if freeze triggered, otherwise 'pending'
            orderDate: new Date()
          }
        });

        // Only credit user if NOT freezing
        let updatedUser;
        if (!shouldFreeze) {
          const creditedCommission = commissionAmount;
          currentDailyEarnings.totalCommission = Math.round((currentDailyEarnings.totalCommission + commissionAmount) * 100) / 100;
          currentDailyEarnings.ordersCount = (currentDailyEarnings.ordersCount || 0) + 1;

          updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              balance: { increment: creditedCommission },
              commission: { increment: commissionAmount },
              dailyEarnings: JSON.stringify(currentDailyEarnings)
            }
          });
        } else {
          // Freeze account - move balance to frozen balance
          // Also clear target product from commission config
          let currentConfig = {};
          try {
            currentConfig = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
          } catch (e) {
            console.error('[Orders] Failed to parse commissionConfig:', e);
            currentConfig = {};
          }
          delete currentConfig.freezeTargetProductId;
          delete currentConfig.freezeTargetPrice;
          delete currentConfig.autoFreezeThreshold; // Also clear threshold

          updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              isFrozen: true,
              frozenBalance: user.balance,
              balance: 0,
              frozenAt: new Date(),
              frozenReason: `Account frozen due to insufficient balance for order. Product price (${randomProduct.price}) exceeds available balance (${user.balance}). Order is suspended. Please contact admin or top up to unlock.`,
              dailyEarnings: JSON.stringify(currentDailyEarnings),
              commissionConfig: JSON.stringify(currentConfig) // Clear everything
            }
          });

          console.log('[Orders/take] ✅ Account frozen with suspended order (freeze config cleared):', {
            userId,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            vipLevel: user.vipLevel,
            frozenBalance: user.balance,
            ordersCompleted: todayOrders.length,
            freezeTrigger: freezeTrigger,
            productPrice: randomProduct.price,
            userBalance: user.balance
          });
        }

        return { newOrder, updatedUser };
      });

      console.log('[Orders/take] ✅ Order created successfully:', {
        orderId: result.newOrder.id,
        clientRequestId,
        productId: randomProduct.id
      });
    } catch (transactionError) {
      // Check if it's a unique constraint violation on clientRequestId
      if (transactionError.code === 'P2002' &&
        transactionError.meta?.target?.includes('clientRequestId')) {
        console.log('[Orders/take] ⚠️ Database constraint caught duplicate:', clientRequestId);

        // Fetch the existing order
        const existing = await prisma.order.findFirst({
          where: { userId, clientRequestId }
        });

        if (existing) {
          return res.json({
            success: true,
            data: buildOrderResponse(existing, user, todayOrders.length, currentDailyEarnings)
          });
        }
      }

      // Re-throw if it's a different error
      console.error('[Orders/take] ❌ Transaction error:', transactionError);
      throw transactionError;
    }


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

        // 🔔 Emit balance update to user for real-time UI update
        io.to(`user:${userId}`).emit('balance:updated', {
          userId: userId,
          newBalance: result.updatedUser.balance,
          newCommission: result.updatedUser.commission,
          commissionIncrement: commissionAmount,
          orderId: result.newOrder.id,
          orderNumber: result.newOrder.orderNumber,
          source: 'order_grab'
        });
        console.log('[Orders] Emitted balance:updated to user:', userId);
      }
    } catch (emitErr) {
      console.error('[Orders] Failed to emit:', emitErr);
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
          commissionRate,
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
        dailyEarnings: currentDailyEarnings,
        // Add freeze notification if account was frozen
        ...(shouldFreeze && {
          accountFrozen: true,
          freezeNotification: {
            title: 'Tài khoản bị đóng băng',
            message: `Đơn hàng của bạn đã bị treo do số dư không đủ. Giá sản phẩm ($${randomProduct.price}) vượt quá số dư khả dụng ($${user.balance}). Vui lòng nạp tiền để mở khóa tài khoản.`,
            frozenBalance: user.balance,
            orderStatus: 'suspended',
            productPrice: randomProduct.price,
            availableBalance: user.balance
          }
        })
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
