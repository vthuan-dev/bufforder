const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { getVipLevelByAmount } = require('../config/vipLevels');
const { authenticateToken } = require('../middleware/auth');

// Helpers
function getDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function resolveCommissionRate(user, vipLevel) {
  if (user?.commissionConfig && user.commissionConfig.baseRate != null) {
    return Number(user.commissionConfig.baseRate);
  }
  return vipLevel ? vipLevel.commissionRate : 0;
}

function pickDailyTarget(user) {
  const cfg = user.commissionConfig || {};
  const modeCfg = cfg.dailyProfitMode || 'auto';
  const isHigh = modeCfg === 'high' ? true : modeCfg === 'low' ? false : Math.random() < 0.35; // 35% high days
  const high = cfg.highTarget || { min: 800, max: 1000 };
  const low = cfg.lowTarget || { min: 450, max: 600 };
  const range = isHigh ? high : low;
  const min = typeof range.min === 'number' ? range.min : (isHigh ? 800 : 450);
  const max = typeof range.max === 'number' ? range.max : (isHigh ? 1000 : 600);
  const target = Math.round((min + Math.random() * (max - min)) * 100) / 100;
  return { mode: isHigh ? 'high' : 'low', targetTotal: target };
}

// GET /api/orders/stats - Get user order statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's orders
    const todayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    // Calculate metrics based on delivered orders (completed)
    const completedOrders = todayOrders.filter(order => order.status === 'delivered');
    const totalCommission = completedOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    // Get VIP level info
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    // Resolve commission rate using user-specific config override
    let commissionRate = vipLevel ? vipLevel.commissionRate : 0;
    if (user.commissionConfig && user.commissionConfig.baseRate != null) {
      commissionRate = Number(user.commissionConfig.baseRate);
    }
    const numberOfOrders = vipLevel && vipLevel.numberOfOrders ? vipLevel.numberOfOrders : 100;

    // Today's earned commission and order count from user's dailyEarnings
    const todayKey = getDateKey();
    const isToday = user.dailyEarnings && user.dailyEarnings.dateKey === todayKey;
    const dailyEarningsToday = {
      totalCommission: isToday ? Number(user.dailyEarnings.totalCommission || 0) : 0,
      ordersCount: isToday ? Number(user.dailyEarnings.ordersCount || 0) : 0,
      targetTotal: isToday ? Number(user.dailyEarnings.targetTotal || 0) : 0,
      mode: isToday ? (user.dailyEarnings.mode || 'auto') : 'auto',
      dateKey: todayKey
    };

    // Count of all orders taken today (any status)
    const ordersGrabbedCount = todayOrders.length;

    res.json({
      success: true,
      data: {
        commission: user.commission + totalCommission,
        balance: user.balance,
        freezeBalance: user.freezeBalance,
        totalDailyTasks: numberOfOrders,
        // Align UI: treat "Completed today" as count of orders taken today
        completedToday: ordersGrabbedCount,
        // ordersGrabbed reflects number of orders taken today (any status)
        ordersGrabbed: ordersGrabbedCount,
        vipLevel: user.vipLevel,
        commissionRate: commissionRate,
        commissionConfig: user.commissionConfig,
        dailyEarnings: dailyEarningsToday
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics'
    });
  }
});

// POST /api/orders/take - Take a new order
router.post('/take', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const clientProduct = req.body && req.body.product;
    const clientRequestId = (req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').toString().trim() || null;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check daily limit
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (todayOrders.length >= 100) {
      return res.status(400).json({
        success: false,
        message: 'Daily order limit reached (100 orders)'
      });
    }

  // Get VIP level and commission rate
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    const commissionRate = resolveCommissionRate(user, vipLevel);
  // Require client to send product, no server-side catalog
  if (!clientProduct) {
    return res.status(400).json({ success: false, message: 'Product is required' });
  }
  // Basic validation of required fields
  const { id, name, price, brand, category, image } = clientProduct;
  if (!id || !name || !price || !brand || !category || !image) {
    return res.status(400).json({ success: false, message: 'Invalid product payload' });
  }
  if (Number(price) > user.balance) {
    return res.status(400).json({ success: false, message: 'Selected product exceeds current balance' });
  }
  const randomProduct = { id, name, price: Number(price), brand, category, image };
    
    // Initialize/reset daily earnings for today (for target steering)
    const todayKey = getDateKey();
    if (user.dailyEarnings?.dateKey !== todayKey) {
      const picked = pickDailyTarget(user);
      user.dailyEarnings = {
        dateKey: todayKey,
        totalCommission: 0,
        ordersCount: 0,
        mode: picked.mode,
        targetTotal: picked.targetTotal
      };
    }

    // Calculate commission with randomness and steering to daily target
    const nominalCommission = (randomProduct.price * commissionRate) / 100;
    const randomFactor = 0.9 + Math.random() * 0.2; // ±10%
    let commissionAmount = Math.round(nominalCommission * randomFactor * 100) / 100;
    const target = Number(user.dailyEarnings?.targetTotal || 0);
    const already = Number(user.dailyEarnings?.totalCommission || 0);
    const remaining = Math.max(0, target - already);
    if (remaining > 0) {
      const maxThisOrder = Math.max(0, remaining + target * 0.05);
      if (commissionAmount > maxThisOrder) commissionAmount = Math.round(maxThisOrder * 100) / 100;
    }

  // If client provided idempotency key, try to find existing order for this user/key today
  if (clientRequestId) {
    const existing = await Order.findOne({ userId, clientRequestId });
    if (existing) {
      return res.json({
        success: true,
        data: {
          // Return current wallet/daily stats without creating duplicate
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
          order: {
            id: existing._id,
            status: existing.status,
            orderDate: existing.orderDate
          },
          dailyEarnings: user.dailyEarnings
        }
      });
    }
  }

  // Create a pending order immediately
  const newOrder = new Order({
    userId: userId,
    clientRequestId: clientRequestId || undefined,
    productId: randomProduct.id,
    productName: randomProduct.name,
    productPrice: randomProduct.price,
    commissionRate: commissionRate,
    commissionAmount: commissionAmount,
    brand: randomProduct.brand,
    category: randomProduct.category,
    image: randomProduct.image,
    status: 'pending',
    orderDate: new Date()
  });
  await newOrder.save();

  // Immediately credit user on pending as per new rule
  const creditedCommission = Math.round(commissionAmount * 0.8 * 100) / 100;
  user.balance += creditedCommission;
  user.commission += commissionAmount;
  user.dailyEarnings.totalCommission = Math.round((user.dailyEarnings.totalCommission + commissionAmount) * 100) / 100;
  user.dailyEarnings.ordersCount = (user.dailyEarnings.ordersCount || 0) + 1;
  await user.save();

    // Get updated stats
    const updatedTodayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const completedOrders = updatedTodayOrders.filter(order => order.status === 'delivered');

    res.json({
      success: true,
      data: {
        newCommission: user.commission,
        newBalance: user.balance,
        // Treat "completed today" on the client as orders taken today (any status)
        newCompletedToday: updatedTodayOrders.length,
        newOrdersGrabbed: updatedTodayOrders.length,
        selectedProduct: {
          productName: randomProduct.name,
          productPrice: randomProduct.price,
          commissionAmount: commissionAmount,
          commissionRate: commissionRate,
          brand: randomProduct.brand,
          productId: randomProduct.id,
          category: randomProduct.category,
          image: randomProduct.image
        },
        order: {
          id: newOrder._id,
          status: newOrder.status,
          orderDate: newOrder.orderDate
        },
        dailyEarnings: user.dailyEarnings
      }
    });
  } catch (error) {
    console.error('Error taking order:', error);
    res.status(500).json({
      success: false,
      message: 'Error taking order'
    });
  }
});

// POST /api/orders/complete - Create and complete an order
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { productData } = req.body;
    
    if (!productData) {
      return res.status(400).json({
        success: false,
        message: 'Product data is required'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user still has sufficient balance
    if (user.balance < productData.productPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to complete this order'
      });
    }

    // Initialize/reset daily earnings for today
    const todayKey = getDateKey();
    if (user.dailyEarnings?.dateKey !== todayKey) {
      const picked = pickDailyTarget(user);
      user.dailyEarnings = {
        dateKey: todayKey,
        totalCommission: 0,
        ordersCount: 0,
        mode: picked.mode,
        targetTotal: picked.targetTotal
      };
    }

    // Determine commission rate (per-user override preferred)
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    const baseRate = resolveCommissionRate(user, vipLevel);
    // Nominal commission with slight randomness (±10%)
    const nominal = (Number(productData.productPrice) * baseRate) / 100;
    const randomFactor = 0.9 + Math.random() * 0.2;
    let commissionAmount = Math.round(nominal * randomFactor * 100) / 100;
    // Steer toward today's target
    const target = Number(user.dailyEarnings?.targetTotal || 0);
    const already = Number(user.dailyEarnings?.totalCommission || 0);
    const remaining = Math.max(0, target - already);
    if (remaining > 0) {
      const maxThisOrder = Math.max(0, remaining + target * 0.05); // up to 5% overshoot
      if (commissionAmount > maxThisOrder) commissionAmount = Math.round(maxThisOrder * 100) / 100;
    }

    // Per new rule: do NOT auto-complete. Just create pending orders via /take.
    // Keep this endpoint no-op to avoid accidental auto-delivery.
    return res.status(400).json({ success: false, message: 'Auto-complete disabled. Orders remain pending until admin updates status.' });

    // Update user balances: credit only 80% of commission to spendable balance
    const creditedCommission = Math.round(newOrder.commissionAmount * 0.8 * 100) / 100;
    user.balance += creditedCommission;
    // Track full commission in lifetime/earned commission
    user.commission += newOrder.commissionAmount;
    // Update daily earnings
    user.dailyEarnings.totalCommission = Math.round((user.dailyEarnings.totalCommission + newOrder.commissionAmount) * 100) / 100;
    user.dailyEarnings.ordersCount = (user.dailyEarnings.ordersCount || 0) + 1;
    await user.save();

    // Get updated stats
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const updatedTodayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const completedOrders = updatedTodayOrders.filter(order => order.status === 'delivered');
    const totalCommission = completedOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    res.json({
      success: true,
      data: {
        newCommission: user.commission,
        newBalance: user.balance,
        newCompletedToday: completedOrders.length,
        newOrdersGrabbed: updatedTodayOrders.length,
        order: {
          productName: newOrder.productName,
          productPrice: newOrder.productPrice,
          commissionAmount: newOrder.commissionAmount
        },
        dailyEarnings: user.dailyEarnings
      }
    });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing order'
    });
  }
});

// GET /api/orders/history - Get order history (with status filter and sort)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status, sortBy = 'orderDate', sortOrder = 'desc' } = req.query;

    const query = { userId: userId };
    if (status) {
      query.status = status;
    }

    // sanitize sort fields to prevent injection
    const allowedSort = ['orderDate', 'productPrice', 'status'];
    const sortField = allowedSort.includes(String(sortBy)) ? String(sortBy) : 'orderDate';
    const sortDir = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

    const orders = await Order.find(query)
      .sort({ [sortField]: sortDir })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    // map to lightweight response for mobile client
    const items = orders.map(o => ({
      id: o._id,
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
    res.status(500).json({
      success: false,
      message: 'Error fetching order history'
    });
  }
});

module.exports = router;
