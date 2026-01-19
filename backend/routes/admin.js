const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { getVipLevelByAmount } = require('../config/vipLevels');
const config = require('../config');
const { hashPassword, comparePassword, excludeFromUser, parseJsonField } = require('../lib/utils');
const { getDashboardStats } = require('../lib/optimized-queries'); // ⚡ Optimized queries
const path = require('path');
const fs = require('fs');

// Setup multer for product image uploads
let productUpload;
try {
  const multer = require('multer');
  const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `product-${Date.now()}${ext}`);
    }
  });

  productUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
      }
    }
  });
} catch (e) {
  productUpload = { single: () => (req, res, next) => next() };
}

const router = express.Router();

// IP Location cache (in-memory)
const ipLocationCache = new Map();

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

// IP Location lookup (proxy to avoid CORS)
router.get('/ip-location/:ip', verifyAdminToken, async (req, res) => {
  try {
    const { ip } = req.params;
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
      return res.json({ success: true, data: { status: 'success', city: 'Local', regionName: '', country: '' } });
    }

    // Check cache first (cache for 1 hour)
    const cached = ipLocationCache.get(ip);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return res.json({ success: true, data: cached.data });
    }

    // Fetch from ip-api.com
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`);
    const data = await response.json();

    // Cache the result
    ipLocationCache.set(ip, { data, timestamp: Date.now() });

    res.json({ success: true, data });
  } catch (error) {
    console.error('IP location error:', error);
    res.json({ success: true, data: { status: 'fail' } });
  }
});

// Public endpoint for client to get their own IP location
router.get('/my-location', async (req, res) => {
  try {
    const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    const ip = rawIp.split(',')[0].trim();
    
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      return res.json({ 
        success: true, 
        data: { 
          status: 'success', 
          city: 'Local', 
          regionName: 'Local', 
          country: 'Local',
          lat: 0,
          lon: 0
        } 
      });
    }

    // Check cache first
    const cached = ipLocationCache.get(ip);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return res.json({ success: true, data: cached.data });
    }

    // Fetch from ip-api.com
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`);
    const data = await response.json();

    // Cache the result
    ipLocationCache.set(ip, { data, timestamp: Date.now() });

    res.json({ success: true, data });
  } catch (error) {
    console.error('My location error:', error);
    res.json({ success: false, data: { status: 'fail' } });
  }
});

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
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName || '',
        phoneNumber: admin.phoneNumber || '',
        isActive: admin.isActive,
        avatar: admin.avatar || ''
      }
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
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        phoneNumber: admin.phoneNumber,
        isActive: admin.isActive,
        avatar: admin.avatar || ''
      }
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

// Upload admin avatar
router.post('/upload-avatar', verifyAdminToken, productUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar file provided' });
    }

    const avatarUrl = `/uploads/products/${req.file.filename}`;

    // Update admin profile with new avatar
    await prisma.admin.update({
      where: { id: req.adminId },
      data: { avatar: avatarUrl }
    });

    res.json({ success: true, data: { avatarUrl } });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
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

    // ============================================
    // 🔓 AUTO-UNLOCK if account is frozen
    // ============================================
    const updateData = {
      balance: newBalance,
      totalDeposited: newTotalDeposited,
      vipLevel: newVipLevel?.id || user.vipLevel
    };

    let suspendedOrderProcessed = null;

    if (user.isFrozen) {
      console.log('[Admin] Auto-unlocking frozen account:', user.id);
      const totalBalance = user.frozenBalance + amount; // Frozen + new deposit
      
      // Find suspended order
      const suspendedOrder = await prisma.order.findFirst({
        where: {
          userId: user.id,
          status: 'suspended'
        },
        orderBy: { orderDate: 'desc' }
      });

      if (suspendedOrder && totalBalance >= suspendedOrder.productPrice) {
        console.log('[Admin] Processing suspended order:', suspendedOrder.id);
        console.log(`[Admin] Total balance: ${totalBalance}, Product price: ${suspendedOrder.productPrice}`);
        
        // Update order to pending and deduct product price
        await prisma.order.update({
          where: { id: suspendedOrder.id },
          data: { status: 'pending' }
        });
        
        // Calculate final balance after deducting product price
        const finalBalance = totalBalance - suspendedOrder.productPrice + suspendedOrder.commissionAmount;
        
        // Clear target product from commission config when auto-unlocking
        let currentConfig = {};
        try {
          currentConfig = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
        } catch (e) {
          console.error('[Admin] Failed to parse commissionConfig:', e);
          currentConfig = {};
        }
        delete currentConfig.freezeTargetProductId;
        delete currentConfig.freezeTargetPrice;
        
        updateData.isFrozen = false;
        updateData.balance = finalBalance;
        updateData.frozenBalance = 0;
        updateData.commission = { increment: suspendedOrder.commissionAmount };
        updateData.unfrozenAt = new Date();
        updateData.unfrozenBy = req.adminId;
        updateData.commissionConfig = JSON.stringify(currentConfig); // Clear target product
        
        suspendedOrderProcessed = {
          orderId: suspendedOrder.id,
          orderNumber: suspendedOrder.orderNumber,
          productPrice: suspendedOrder.productPrice,
          commission: suspendedOrder.commissionAmount,
          newStatus: 'pending'
        };
        
        console.log('[Admin] ✅ Suspended order processed and account unlocked (target product cleared)');
      } else if (suspendedOrder) {
        console.log('[Admin] ⚠️ Insufficient balance to process suspended order');
        console.log(`[Admin] Need: ${suspendedOrder.productPrice}, Have: ${totalBalance}`);
        // Still frozen, just add to frozen balance
        updateData.frozenBalance = totalBalance;
      } else {
        // No suspended order, just unlock
        // Clear target product from commission config
        let currentConfig = {};
        try {
          currentConfig = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
        } catch (e) {
          console.error('[Admin] Failed to parse commissionConfig:', e);
          currentConfig = {};
        }
        delete currentConfig.freezeTargetProductId;
        delete currentConfig.freezeTargetPrice;
        
        updateData.isFrozen = false;
        updateData.balance = totalBalance;
        updateData.frozenBalance = 0;
        updateData.unfrozenAt = new Date();
        updateData.unfrozenBy = req.adminId;
        updateData.commissionConfig = JSON.stringify(currentConfig); // Clear target product
      }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: updateData
      }),
      prisma.depositRequest.update({
        where: { id: requestId },
        data: { status: 'approved', approvedBy: req.adminId, approvedAt: new Date(), notes }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Deposit Approved',
          message: `Your deposit of $${amount.toLocaleString()} has been approved.`,
          type: 'success'
        }
      })
    ]);

    // 🔔 Emit notification to client
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${user.id}`).emit('notification:new', {
          title: 'Deposit Approved',
          message: `Your deposit of $${amount.toLocaleString()} has been approved.`,
          type: 'success'
        });
      }
    } catch (e) { console.error('[Socket] Notify error:', e); }

    res.json({
      success: true,
      message: 'Deposit approved',
      data: { 
        requestId, 
        amount, 
        user: { id: user.id, newBalance: updateData.balance, newTotalDeposited, newVipLevel: newVipLevel?.id },
        suspendedOrderProcessed // Include info if suspended order was processed
      }
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

    await prisma.$transaction([
      prisma.depositRequest.update({
        where: { id: requestId },
        data: { status: 'rejected', approvedBy: req.adminId, approvedAt: new Date(), rejectionReason, notes }
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          title: 'Deposit Rejected',
          message: `Your deposit of $${request.amount.toLocaleString()} was rejected. Reason: ${rejectionReason}`,
          type: 'error'
        }
      })
    ]);

    // 🔔 Emit notification to client
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${request.userId}`).emit('notification:new', {
          title: 'Deposit Rejected',
          message: `Your deposit of $${request.amount.toLocaleString()} was rejected.`,
          type: 'error'
        });
      }
    } catch (e) { console.error('[Socket] Notify error:', e); }

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
      include: {
        user: { select: { id: true, phoneNumber: true, email: true, fullName: true, balance: true } },
        bankCard: { select: { id: true, bankName: true, cardNumber: true, accountName: true } }
      },
      orderBy: { requestDate: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.withdrawalRequest.count({ where });

    res.json({
      success: true,
      data: {
        requests: requests.map(r => ({
          ...r,
          userId: r.user,
          withdrawalType: r.withdrawalType || 'bank',
          walletAddress: r.walletAddress || '',
          network: r.network || '',
          bankName: r.bankCard?.bankName || '',
          accountNumber: r.bankCard?.cardNumber || '',
          accountName: r.bankCard?.accountName || r.user?.fullName || ''
        })),
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
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Withdrawal Approved',
          message: `Your withdrawal of $${wr.amount.toLocaleString()} has been approved.`,
          type: 'success'
        }
      })
    ]);

    // 🔔 Emit notification to client
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${user.id}`).emit('notification:new', {
          title: 'Withdrawal Approved',
          message: `Your withdrawal of $${wr.amount.toLocaleString()} has been approved.`,
          type: 'success'
        });
      }
    } catch (e) { console.error('[Socket] Notify error:', e); }

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

    const reasonText = reason || 'Rejected by admin';
    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id: wr.id },
        data: { status: 'rejected', rejectionReason: reasonText, approvedBy: req.adminId, approvedAt: new Date() }
      }),
      prisma.notification.create({
        data: {
          userId: wr.userId,
          title: 'Withdrawal Rejected',
          message: `Your withdrawal of $${wr.amount.toLocaleString()} was rejected. Reason: ${reasonText}`,
          type: 'error'
        }
      })
    ]);

    // 🔔 Emit notification to client
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${wr.userId}`).emit('notification:new', {
          title: 'Withdrawal Rejected',
          message: `Your withdrawal of $${wr.amount.toLocaleString()} was rejected.`,
          type: 'error'
        });
      }
    } catch (e) { console.error('[Socket] Notify error:', e); }

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

// GET /api/admin/users/:id/order-stats - Get user's order statistics
router.get('/users/:id/order-stats', verifyAdminToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get today's date key
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Count today's completed orders
    const todayOrders = await prisma.order.count({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }
    });
    
    // Get user's commission config to check for saved target product
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { commissionConfig: true }
    });
    
    // Parse commissionConfig (it's stored as JSON string)
    let commissionConfig = {};
    try {
      commissionConfig = user?.commissionConfig ? JSON.parse(user.commissionConfig) : {};
    } catch (e) {
      console.error('Failed to parse commissionConfig:', e);
      commissionConfig = {};
    }
    
    const freezeTargetProductId = commissionConfig.freezeTargetProductId;
    
    // If there's a saved target product, fetch its details
    let targetProduct = null;
    if (freezeTargetProductId) {
      targetProduct = await prisma.product.findUnique({
        where: { id: parseInt(freezeTargetProductId) },
        select: {
          id: true,
          name: true,
          brand: true,
          price: true,
          image: true
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        todayOrders,
        dateKey: todayKey,
        autoFreezeThreshold: commissionConfig.autoFreezeThreshold || null,
        freezeTargetProductId,
        targetProduct
      }
    });
  } catch (error) {
    console.error('Get user order stats error:', error);
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

    // Handle balance changes (add, set, or subtract)
    let balanceDelta = 0;
    let balanceChangeType = 'none'; // 'add', 'set', 'subtract', 'none'
    
    if (balance !== undefined) {
      const newBalance = Number(balance);
      const currentBalance = currentUser.balance;
      
      // Determine the type of balance change
      if (newBalance > currentBalance) {
        balanceChangeType = 'add';
        balanceDelta = newBalance - currentBalance;
      } else if (newBalance < currentBalance) {
        balanceChangeType = 'subtract';
        balanceDelta = currentBalance - newBalance;
      }
      
      // Always allow balance changes (add, set, or subtract)
      data.balance = newBalance;
      
      // Only update totalDeposited if balance increased (add operation)
      if (balanceChangeType === 'add') {
        data.totalDeposited = currentUser.totalDeposited + balanceDelta;
        const newVipLevel = getVipLevelByAmount(data.totalDeposited);
        if (newVipLevel) data.vipLevel = newVipLevel.id;
      }
      // For subtract/set operations, don't change totalDeposited or VIP level
    }

    // Use transaction to update user and create appropriate records
    let user;
    let notification;
    
    if (balanceChangeType === 'add') {
      // Balance increased - create deposit request
      const result = await prisma.$transaction([
        prisma.user.update({
          where: { id: req.params.id },
          data,
          include: { addresses: true, bankCards: true }
        }),
        prisma.depositRequest.create({
          data: {
            userId: req.params.id,
            amount: balanceDelta,
            status: 'approved',
            approvedBy: req.adminId,
            approvedAt: new Date(),
            notes: 'Manually added by admin',
            requestDate: new Date()
          }
        }),
        prisma.notification.create({
          data: {
            userId: req.params.id,
            title: 'Balance Added',
            message: `Admin has added ${balanceDelta.toLocaleString()} to your account.`,
            type: 'success'
          }
        })
      ]);
      user = result[0];
      notification = result[2];

      // 🔔 Emit notification and balance update to client
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${req.params.id}`).emit('notification:new', {
            id: notification.id,
            title: 'Balance Added',
            message: `Admin has added ${balanceDelta.toLocaleString()} to your account.`,
            type: 'success',
            createdAt: notification.createdAt
          });
          io.to(`user:${req.params.id}`).emit('balance:updated', {
            balance: user.balance,
            commission: user.commission || 0
          });
        }
      } catch (e) { console.error('[Socket] Balance update notify error:', e); }
    } else if (balanceChangeType === 'subtract') {
      // Balance decreased - create notification only
      const result = await prisma.$transaction([
        prisma.user.update({
          where: { id: req.params.id },
          data,
          include: { addresses: true, bankCards: true }
        }),
        prisma.notification.create({
          data: {
            userId: req.params.id,
            title: 'Balance Adjusted',
            message: `Admin has deducted ${balanceDelta.toLocaleString()} from your account.`,
            type: 'info'
          }
        })
      ]);
      user = result[0];
      notification = result[1];

      // 🔔 Emit notification and balance update to client
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${req.params.id}`).emit('notification:new', {
            id: notification.id,
            title: 'Balance Adjusted',
            message: `Admin has deducted ${balanceDelta.toLocaleString()} from your account.`,
            type: 'info',
            createdAt: notification.createdAt
          });
          io.to(`user:${req.params.id}`).emit('balance:updated', {
            balance: user.balance,
            commission: user.commission || 0
          });
        }
      } catch (e) { console.error('[Socket] Balance update notify error:', e); }
    } else {
      // No balance change or other updates only
      user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        include: { addresses: true, bankCards: true }
      });
    }

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

    const [updatedUser, depositRequest, notification] = await prisma.$transaction([
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
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Deposit Received',
          message: `You have received a deposit of $${add.toLocaleString()}.`,
          type: 'success'
        }
      })
    ]);

    // 🔔 Emit notification and balance update to client
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${user.id}`).emit('notification:new', {
          id: notification.id,
          title: 'Deposit Received',
          message: `You have received a deposit of $${add.toLocaleString()}.`,
          type: 'success',
          createdAt: notification.createdAt
        });
        io.to(`user:${user.id}`).emit('balance:updated', {
          balance: updatedUser.balance,
          commission: updatedUser.commission || 0
        });
      }
    } catch (e) { console.error('[Socket] Topup notify error:', e); }

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

// POST /api/admin/users/:id/unlock - Unlock frozen account
router.post('/users/:id/unlock', verifyAdminToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { restoreBalance = true } = req.body; // Option to restore frozen balance

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isFrozen) {
      return res.status(400).json({ success: false, message: 'Account is not frozen' });
    }

    // Unlock account and restore balance
    // Also clear target product from commission config
    let currentConfig = {};
    try {
      currentConfig = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
    } catch (e) {
      console.error('[Admin] Failed to parse commissionConfig:', e);
      currentConfig = {};
    }
    delete currentConfig.freezeTargetProductId;
    delete currentConfig.freezeTargetPrice;
    
    const updateData = {
      isFrozen: false,
      unfrozenAt: new Date(),
      unfrozenBy: req.adminId,
      commissionConfig: JSON.stringify(currentConfig) // Clear target product
    };

    if (restoreBalance) {
      updateData.balance = user.frozenBalance;
      updateData.frozenBalance = 0;
    }

    const [updatedUser, notification] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: updateData
      }),
      prisma.notification.create({
        data: {
          userId: userId,
          title: 'Account Unlocked',
          message: restoreBalance 
            ? `Your account has been unlocked. Balance restored: $${user.frozenBalance.toFixed(2)}`
            : 'Your account has been unlocked by admin.',
          type: 'success'
        }
      })
    ]);

    // 🔔 Emit notification to user
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${userId}`).emit('notification:new', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt
        });
        io.to(`user:${userId}`).emit('account:unlocked', {
          balance: updatedUser.balance,
          frozenBalance: updatedUser.frozenBalance,
          isFrozen: false
        });
      }
    } catch (e) {
      console.error('[Socket] Unlock notify error:', e);
    }

    console.log('[Admin] Account unlocked:', {
      userId,
      adminId: req.adminId,
      restoredBalance: restoreBalance ? user.frozenBalance : 0
    });

    res.json({
      success: true,
      message: 'Account unlocked successfully',
      data: {
        user: excludeFromUser(updatedUser),
        restoredBalance: restoreBalance ? user.frozenBalance : 0
      }
    });
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/admin/users/:id/freeze - Freeze user account and balance
router.post('/users/:id/freeze', verifyAdminToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason = 'Frozen by admin' } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isFrozen) {
      return res.status(400).json({ success: false, message: 'Account is already frozen' });
    }

    // Freeze account and move balance to frozenBalance
    const updateData = {
      isFrozen: true,
      frozenBalance: user.balance,
      balance: 0,
      frozenAt: new Date(),
      frozenReason: reason
    };

    const [updatedUser, notification] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: updateData
      }),
      prisma.notification.create({
        data: {
          userId: userId,
          title: 'Account Frozen',
          message: `Your account has been frozen by admin. Reason: ${reason}`,
          type: 'error'
        }
      })
    ]);

    // 🔔 Emit notification to user
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${userId}`).emit('notification:new', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt
        });
        io.to(`user:${userId}`).emit('account:frozen', {
          balance: 0,
          frozenBalance: updatedUser.frozenBalance,
          isFrozen: true,
          frozenReason: reason
        });
      }
    } catch (e) {
      console.error('[Socket] Freeze notify error:', e);
    }

    console.log('[Admin] Account frozen:', {
      userId,
      adminId: req.adminId,
      frozenBalance: user.balance,
      reason
    });

    res.json({
      success: true,
      message: 'Account frozen successfully',
      data: {
        user: excludeFromUser(updatedUser),
        frozenBalance: user.balance
      }
    });
  } catch (error) {
    console.error('Freeze account error:', error);
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

    // Parse existing config (it's stored as JSON string)
    let existingConfig = {};
    try {
      existingConfig = user.commissionConfig ? JSON.parse(user.commissionConfig) : {};
    } catch (e) {
      console.error('Failed to parse existing commissionConfig:', e);
      existingConfig = {};
    }
    
    const newConfig = { ...existingConfig, ...commissionConfig };

    // Stringify once for String field
    await prisma.user.update({
      where: { id: req.params.id },
      data: { commissionConfig: JSON.stringify(newConfig) }
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

    // Generate orderId like in list endpoint
    const orderId = `ORD-${order.orderDate.toISOString().split('T')[0].replace(/-/g, '')}-${order.id.slice(-3).toUpperCase()}`;

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderId: orderId,
          user: {
            name: order.user?.fullName || 'Unknown',
            email: order.user?.email || '',
            phoneNumber: order.user?.phoneNumber || '',
            balance: order.user?.balance || 0,
            totalDeposited: order.user?.totalDeposited || 0,
            vipLevel: order.user?.vipLevel || 'vip-0'
          },
          product: { name: order.productName, image: order.image, brand: order.brand, category: order.category },
          amount: order.productPrice,
          commission: order.commissionAmount,
          commissionRate: order.commissionRate,
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
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

    const oldStatus = order.status.toLowerCase();
    const newStatus = status.toLowerCase();

    // ⚡ Status transition rules - Relaxed to allow any transition
    const allStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    // Check if new status is valid
    if (!allStatuses.includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Check if transition is allowed (relaxed: any transition allowed)
    if (oldStatus === newStatus) {
      return res.status(400).json({ success: false, message: 'Order is already in this status' });
    }


    const data = { status: newStatus };

    // Handle delivered status - only update completedAt timestamp if needed
    if (newStatus === 'delivered' && !order.completedAt) {
      data.completedAt = new Date();
    }

    await prisma.order.update({ where: { id: req.params.id }, data });

    res.json({
      success: true,
      message: `Order status updated from ${oldStatus} to ${newStatus}`,
      data: { order: { id: order.id, status: newStatus, completedAt: data.completedAt } }
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

// =====================
// Products Management (Admin CRUD)
// =====================
router.get('/products', verifyAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '', category = 'all', isActive = 'all' } = req.query;
    const where = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { category: { contains: q } }
      ];
    }
    if (category !== 'all') where.category = category;
    if (isActive !== 'all') where.isActive = isActive === 'true';

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: {
        products,
        pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
      }
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/products/:id', verifyAdminToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Find product by price (for freeze target product selection)
router.get('/products/find-by-price/:targetPrice', verifyAdminToken, async (req, res) => {
  try {
    const targetPrice = parseFloat(req.params.targetPrice);
    
    if (isNaN(targetPrice) || targetPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid price' });
    }

    // Find products closest to target price (within ±20% range)
    const minPrice = targetPrice * 0.8;
    const maxPrice = targetPrice * 1.2;

    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: minPrice,
          lte: maxPrice
        },
        isActive: true
      },
      orderBy: {
        price: 'asc'
      },
      take: 10 // Return top 10 products
    });

    if (products.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'No products found in price range'
      });
    }

    // Sort by closest to target price
    const sortedProducts = products
      .map(p => ({
        ...p,
        priceDiff: Math.abs(p.price - targetPrice)
      }))
      .sort((a, b) => a.priceDiff - b.priceDiff)
      .map(({ priceDiff, ...product }) => product);

    res.json({ 
      success: true, 
      data: sortedProducts
    });
  } catch (error) {
    console.error('Find product by price error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/products', verifyAdminToken, async (req, res) => {
  try {
    const { name, brand, category, price, image, productUrl, isActive = true } = req.body;

    if (!name || !brand || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'name, brand, category, price are required' });
    }

    const product = await prisma.product.create({
      data: { name, brand, category, price: parseFloat(price), image, productUrl, isActive }
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/products/:id', verifyAdminToken, async (req, res) => {
  try {
    const { name, brand, category, price, image, productUrl, isActive } = req.body;
    const data = {};

    if (name !== undefined) data.name = name;
    if (brand !== undefined) data.brand = brand;
    if (category !== undefined) data.category = category;
    if (price !== undefined) data.price = parseFloat(price);
    if (image !== undefined) data.image = image;
    if (productUrl !== undefined) data.productUrl = productUrl;
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data
    });

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/products/:id', verifyAdminToken, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload product image
router.post('/products/upload-image', verifyAdminToken, productUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    res.json({ success: true, data: { imageUrl } });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
