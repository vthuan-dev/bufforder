const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { getVipLevelByAmount } = require('../config/vipLevels');
const config = require('../config');
const { hashPassword, comparePassword, excludeFromUser, parseJsonField } = require('../lib/utils');
const { getDashboardStats } = require('../lib/optimized-queries'); // ⚡ Optimized queries

const router = express.Router();

// Helper: format date in Vietnam time
function formatDateVN(date) {
  try {
    return new Date(date)
      .toLocaleString('sv-SE', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace('T', ' ')
      .slice(0, 16);
  } catch {
    return new Date(date).toISOString().replace('T', ' ').slice(0, 16);
  }
}

// Middleware to verify admin JWT token
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin token required' });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const admin = await prisma.admin.findFirst({ where: { username, isActive: true } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    });

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role, lastLogin: admin.lastLogin }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin profile
router.get('/profile', verifyAdminToken, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    res.json({
      success: true,
      data: { id: admin.id, username: admin.username, email: admin.email, fullName: admin.fullName || '', phoneNumber: admin.phoneNumber || '', isActive: admin.isActive }
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update admin profile
router.patch('/profile', verifyAdminToken, async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;
    const data = {};
    if (typeof fullName === 'string') data.fullName = fullName.trim();
    if (typeof email === 'string') data.email = email.trim().toLowerCase();
    if (typeof phoneNumber === 'string') data.phoneNumber = phoneNumber.trim();

    const admin = await prisma.admin.update({
      where: { id: req.adminId },
      data
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { id: admin.id, username: admin.username, email: admin.email, fullName: admin.fullName, phoneNumber: admin.phoneNumber, isActive: admin.isActive }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change admin password
router.post('/change-password', verifyAdminToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const isValid = await comparePassword(currentPassword, admin.password);
    if (!isValid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hashedPassword = await hashPassword(newPassword);
    await prisma.admin.update({
      where: { id: req.adminId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// Deposit Requests
// =====================
router.get('/deposit-requests', verifyAdminToken, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const where = status !== 'all' ? { status } : {};

    const requests = await prisma.depositRequest.findMany({
      where,
      include: { user: { select: { id: true, phoneNumber: true, email: true, fullName: true } } },
      orderBy: { requestDate: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.depositRequest.count({ where });

    res.json({
      success: true,
      data: {
        requests: requests.map(r => ({ ...r, userId: r.user })),
        pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
      }
    });
  } catch (error) {
    console.error('Get deposit requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/deposit-requests/:requestId/approve', verifyAdminToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    const depositRequest = await prisma.depositRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!depositRequest) return res.status(404).json({ success: false, message: 'Deposit request not found' });
    if (depositRequest.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

    const user = depositRequest.user;
    const amount = depositRequest.amount;
    const newTotalDeposited = user.totalDeposited + amount;
    const newBalance = user.balance + amount;
    const newVipLevel = getVipLevelByAmount(newTotalDeposited);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: newBalance,
          totalDeposited: newTotalDeposited,
          vipLevel: newVipLevel?.id || user.vipLevel
        }
      }),
      prisma.depositRequest.update({
        where: { id: requestId },
        data: { status: 'approved', approvedBy: req.adminId, approvedAt: new Date(), notes }
      })
    ]);

    res.json({
      success: true,
      message: 'Deposit approved',
      data: { requestId, amount, user: { id: user.id, newBalance, newTotalDeposited, newVipLevel: newVipLevel?.id } }
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/deposit-requests/:requestId/reject', verifyAdminToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason, notes } = req.body;
    if (!rejectionReason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

    const request = await prisma.depositRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

    await prisma.depositRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', approvedBy: req.adminId, approvedAt: new Date(), rejectionReason, notes }
    });

    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// Withdrawal Requests
// =====================
router.get('/withdrawal-requests', verifyAdminToken, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const where = status !== 'all' ? { status } : {};

    const requests = await prisma.withdrawalRequest.findMany({
      where,
      include: { user: { select: { id: true, phoneNumber: true, email: true, fullName: true, balance: true } } },
      orderBy: { requestDate: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.withdrawalRequest.count({ where });

    res.json({
      success: true,
      data: {
        requests: requests.map(r => ({ ...r, userId: r.user })),
        pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
      }
    });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/withdrawal-requests/:id/approve', verifyAdminToken, async (req, res) => {
  try {
    const wr = await prisma.withdrawalRequest.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });
    if (!wr) return res.status(404).json({ success: false, message: 'Not found' });
    if (wr.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

    const user = wr.user;
    if (user.balance < wr.amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: wr.amount } }
      }),
      prisma.withdrawalRequest.update({
        where: { id: wr.id },
        data: { status: 'approved', approvedBy: req.adminId, approvedAt: new Date() }
      })
    ]);

    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/withdrawal-requests/:id/reject', verifyAdminToken, async (req, res) => {
  try {
    const { reason } = req.body || {};
    const wr = await prisma.withdrawalRequest.findUnique({ where: { id: req.params.id } });
    if (!wr) return res.status(404).json({ success: false, message: 'Not found' });
    if (wr.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

    await prisma.withdrawalRequest.update({
      where: { id: wr.id },
      data: { status: 'rejected', rejectionReason: reason || 'Rejected by admin', approvedBy: req.adminId, approvedAt: new Date() }
    });

    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// Dashboard Statistics
// =====================
const { cached } = require('../lib/cache');

router.get('/dashboard/stats', verifyAdminToken, async (req, res) => {
  try {
    // ⚡ Cache dashboard stats for 30 seconds
    const stats = await cached('admin:dashboard:stats', () => getDashboardStats(), 30);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/dashboard/recent-users', verifyAdminToken, async (req, res) => {
  try {
    const recentUsers = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, vipLevel: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      vip: user.vipLevel.replace('vip-', 'VIP ').replace('royal-vip', 'Royal VIP').replace('svip', 'SVIP'),
      status: user.isActive ? 'Active' : 'Inactive',
      joinDate: user.createdAt.toISOString().split('T')[0]
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('Get recent users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// Users Management
// =====================
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', sortBy = 'createdAt', sortOrder = 'desc', status } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { phoneNumber: { contains: q } }
      ];
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const users = await prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      include: { addresses: true, bankCards: true }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: {
        users: users.map(u => excludeFromUser(u)),
        pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { addresses: true, bankCards: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user: excludeFromUser(user) } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users', verifyAdminToken, async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, vipLevel = 'vip-0', balance = 0, isActive = true } = req.body;

    if (!fullName || !phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'fullName, phoneNumber and password are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phoneNumber }] }
    });
    if (existing) return res.status(409).json({ success: false, message: 'Email or phone already exists' });

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { fullName, email, phoneNumber, password: hashedPassword, vipLevel, balance, isActive }
    });

    res.status(201).json({ success: true, data: { user: excludeFromUser(user) } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, vipLevel, balance, isActive, commissionConfig } = req.body;

    const currentUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (email !== undefined) data.email = email;
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
    if (vipLevel !== undefined) data.vipLevel = vipLevel;
    if (isActive !== undefined) data.isActive = isActive;
    if (commissionConfig !== undefined) data.commissionConfig = commissionConfig;
    if (password) data.password = await hashPassword(password);

    // Handle balance increase (treat as deposit)
    if (balance !== undefined) {
      const newBalance = Number(balance);
      if (newBalance < currentUser.balance) {
        return res.status(400).json({ success: false, message: 'Balance decrease not allowed' });
      }
      const delta = newBalance - currentUser.balance;
      if (delta > 0) {
        data.balance = newBalance;
        data.totalDeposited = currentUser.totalDeposited + delta;
        const newVipLevel = getVipLevelByAmount(data.totalDeposited);
        if (newVipLevel) data.vipLevel = newVipLevel.id;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { addresses: true, bankCards: true }
    });

    res.json({ success: true, data: { user: excludeFromUser(user) } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users/:id/topup', verifyAdminToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const add = Number(amount);
    if (!add || isNaN(add) || add <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newTotalDeposited = user.totalDeposited + add;
    const newVipLevel = getVipLevelByAmount(newTotalDeposited);

    const [updatedUser, depositRequest] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: add },
          totalDeposited: newTotalDeposited,
          vipLevel: newVipLevel?.id || user.vipLevel
        }
      }),
      prisma.depositRequest.create({
        data: {
          userId: user.id,
          amount: add,
          status: 'approved',
          approvedBy: req.adminId,
          approvedAt: new Date(),
          notes: 'Admin top up'
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Top up successful',
      data: { user: excludeFromUser(updatedUser), added: add, depositRequestId: depositRequest.id }
    });
  } catch (error) {
    console.error('Admin topup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/users/:id/status', verifyAdminToken, async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean is required' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    res.json({ success: true, data: { user: excludeFromUser(user) } });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users/:id/commission-config', verifyAdminToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { commissionConfig: true, dailyEarnings: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      data: { commissionConfig: parseJsonField(user.commissionConfig, {}), dailyEarnings: parseJsonField(user.dailyEarnings, {}) }
    });
  } catch (error) {
    console.error('Get commission config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/users/:id/commission-config', verifyAdminToken, async (req, res) => {
  try {
    const { commissionConfig } = req.body || {};
    if (!commissionConfig || typeof commissionConfig !== 'object') {
      return res.status(400).json({ success: false, message: 'commissionConfig object is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const existingConfig = parseJsonField(user.commissionConfig, {});
    const newConfig = { ...existingConfig, ...commissionConfig };

    await prisma.user.update({
      where: { id: req.params.id },
      data: { commissionConfig: newConfig }
    });

    res.json({ success: true, message: 'Commission config updated', data: { commissionConfig: newConfig } });
  } catch (error) {
    console.error('Update commission config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// Orders Management
// =====================

// Order Stats - MUST be before /orders/:id to avoid route conflict
router.get('/orders/stats', verifyAdminToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [totalOrders, todayOrdersCount] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { orderDate: { gte: startOfDay, lt: endOfDay } } })
    ]);

    const revenueStats = await prisma.order.aggregate({
      _sum: { productPrice: true, commissionAmount: true }
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders: todayOrdersCount,
        totalRevenue: revenueStats._sum.productPrice || 0,
        totalCommission: revenueStats._sum.commissionAmount || 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/orders', verifyAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '', status = 'all', sortBy = 'orderDate', sortOrder = 'desc' } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { productName: { contains: q } },
        { brand: { contains: q } }
      ];
    }
    if (status !== 'all') where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { fullName: true, email: true, phoneNumber: true } } },
      orderBy: { [sortBy]: sortOrder },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.order.count({ where });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: `ORD-${order.orderDate.toISOString().split('T')[0].replace(/-/g, '')}-${order.id.slice(-3).toUpperCase()}`,
      user: { name: order.user?.fullName || 'Unknown', email: order.user?.email || '', phoneNumber: order.user?.phoneNumber || '' },
      product: { name: order.productName, image: order.image || '', brand: order.brand || '', category: order.category || '' },
      amount: order.productPrice,
      commission: order.commissionAmount,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      orderDate: formatDateVN(order.orderDate),
      deliveryDate: order.completedAt ? formatDateVN(order.completedAt) : null
    }));

    res.json({
      success: true,
      data: { orders: formattedOrders, pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total } }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/orders/:id', verifyAdminToken, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { fullName: true, email: true, phoneNumber: true, balance: true, totalDeposited: true, vipLevel: true } } }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          user: order.user,
          product: { name: order.productName, image: order.image, brand: order.brand, category: order.category },
          amount: order.productPrice,
          commission: order.commissionAmount,
          status: order.status,
          orderDate: formatDateVN(order.orderDate),
          deliveryDate: order.completedAt ? formatDateVN(order.completedAt) : null
        }
      }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/orders/:id/status', verifyAdminToken, async (req, res) => {
  try {
    const { status } = req.body || {};
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const oldStatus = order.status;
    const data = { status };

    // Handle delivered status
    if (status === 'delivered' && !order.completedAt) {
      data.completedAt = new Date();
      // Credit user commission
      await prisma.user.update({
        where: { id: order.userId },
        data: {
          balance: { increment: order.commissionAmount },
          commission: { increment: order.commissionAmount }
        }
      });
    }

    await prisma.order.update({ where: { id: req.params.id }, data });

    res.json({
      success: true,
      message: `Order status updated from ${oldStatus} to ${status}`,
      data: { order: { id: order.id, status, completedAt: data.completedAt } }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Weekly Revenue Stats - ⚡ Optimized with single query + caching
router.get('/dashboard/weekly-revenue', verifyAdminToken, async (req, res) => {
  try {
    const weeklyData = await cached('admin:weekly-revenue', async () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      // Single query for all 7 days
      const orders = await prisma.order.findMany({
        where: { orderDate: { gte: sevenDaysAgo } },
        select: { orderDate: true, productPrice: true }
      });
      
      // Group by day
      const dayMap = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        const dateKey = date.toISOString().split('T')[0];
        dayMap[dateKey] = { name: dayName, value: 0 };
      }
      
      orders.forEach(order => {
        const dateKey = order.orderDate.toISOString().split('T')[0];
        if (dayMap[dateKey]) {
          dayMap[dateKey].value += order.productPrice || 0;
        }
      });
      
      return Object.values(dayMap);
    }, 60); // Cache 1 minute
    
    res.json({ success: true, data: weeklyData });
  } catch (error) {
    console.error('Get weekly revenue error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User Growth Stats - ⚡ Optimized with single query + caching
router.get('/dashboard/user-growth', verifyAdminToken, async (req, res) => {
  try {
    const growthData = await cached('admin:user-growth', async () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      // Single query for all 7 days
      const users = await prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
      });
      
      // Group by day
      const dayMap = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        const dateKey = date.toISOString().split('T')[0];
        dayMap[dateKey] = { name: dayName, users: 0 };
      }
      
      users.forEach(user => {
        const dateKey = user.createdAt.toISOString().split('T')[0];
        if (dayMap[dateKey]) {
          dayMap[dateKey].users += 1;
        }
      });
      
      return Object.values(dayMap);
    }, 60); // Cache 1 minute
    
    res.json({ success: true, data: growthData });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
