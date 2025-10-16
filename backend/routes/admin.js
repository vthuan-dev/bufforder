const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const DepositRequest = require('../models/DepositRequest');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { getVipLevelByAmount } = require('../config/vipLevels');
const config = require('../config');

const router = express.Router();
const Order = require('../models/Order');

// Helper: format date in Vietnam time as YYYY-MM-DD HH:mm
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
    return res.status(401).json({ 
      success: false, 
      message: 'Admin token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid admin token' 
    });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, username: admin.username, role: admin.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Admin profile
router.get('/profile', verifyAdminToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName || '',
        phoneNumber: admin.phoneNumber || '',
        fullName: admin.fullName,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Update admin profile
router.patch('/profile', verifyAdminToken, async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (typeof fullName === 'string') admin.fullName = fullName.trim();
    if (typeof email === 'string') admin.email = email.trim().toLowerCase();
    if (typeof phoneNumber === 'string') admin.phoneNumber = phoneNumber.trim();

    await admin.save();

    const sanitized = await Admin.findById(admin._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: sanitized._id,
        username: sanitized.username,
        email: sanitized.email,
        fullName: sanitized.fullName || '',
        phoneNumber: sanitized.phoneNumber || '',
        isActive: sanitized.isActive
      }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// Change admin password
router.post('/change-password', verifyAdminToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find admin
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword; // This will be hashed by the pre-save middleware
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get all pending deposit requests
router.get('/deposit-requests', verifyAdminToken, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const depositRequests = await DepositRequest.find(query)
      .populate('userId', 'username email phoneNumber')
      .populate('approvedBy', 'username email')
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DepositRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests: depositRequests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get deposit requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Approve deposit request
router.post('/deposit-requests/:requestId/approve', verifyAdminToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    // Find the deposit request
    const depositRequest = await DepositRequest.findById(requestId)
      .populate('userId');

    if (!depositRequest) {
      return res.status(404).json({
        success: false,
        message: 'Deposit request not found'
      });
    }

    if (depositRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Deposit request has already been processed'
      });
    }

    // Get admin info
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update user balance and total deposited
    const user = depositRequest.userId;
    const upgradeInfo = user.addDeposit(depositRequest.amount);
    await user.save();

    // Update deposit request
    depositRequest.status = 'approved';
    depositRequest.approvedBy = req.adminId;
    depositRequest.approvedAt = new Date();
    depositRequest.notes = notes;
    await depositRequest.save();

    res.json({
      success: true,
      message: 'Deposit request approved successfully',
      data: {
        requestId: depositRequest._id,
        amount: depositRequest.amount,
        user: {
          id: user._id,
          username: user.username,
          newBalance: user.balance,
          newTotalDeposited: user.totalDeposited,
          newVipLevel: user.vipLevel
        },
        upgradeInfo: upgradeInfo,
        approvedBy: {
          id: admin._id,
          username: admin.username
        }
      }
    });
  } catch (error) {
    console.error('Approve deposit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Reject deposit request
router.post('/deposit-requests/:requestId/reject', verifyAdminToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason, notes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find the deposit request
    const depositRequest = await DepositRequest.findById(requestId)
      .populate('userId');

    if (!depositRequest) {
      return res.status(404).json({
        success: false,
        message: 'Deposit request not found'
      });
    }

    if (depositRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Deposit request has already been processed'
      });
    }

    // Get admin info
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update deposit request
    depositRequest.status = 'rejected';
    depositRequest.approvedBy = req.adminId;
    depositRequest.approvedAt = new Date();
    depositRequest.rejectionReason = rejectionReason;
    depositRequest.notes = notes;
    await depositRequest.save();

    res.json({
      success: true,
      message: 'Deposit request rejected successfully',
      data: {
        requestId: depositRequest._id,
        amount: depositRequest.amount,
        user: {
          id: depositRequest.userId._id,
          username: depositRequest.userId.username
        },
        rejectionReason,
        rejectedBy: {
          id: admin._id,
          username: admin.username
        }
      }
    });
  } catch (error) {
    console.error('Reject deposit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// ===== Withdrawal requests admin =====
// List withdrawal requests
router.get('/withdrawal-requests', verifyAdminToken, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;

    const requests = await WithdrawalRequest.find(query)
      .populate('userId', 'username email phoneNumber fullName balance')
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WithdrawalRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (e) {
    console.error('Get withdrawal requests error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve withdrawal request (deduct user balance)
router.post('/withdrawal-requests/:id/approve', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const wr = await WithdrawalRequest.findById(id).populate('userId');
    if (!wr) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    if (wr.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    const user = wr.userId;
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // Deduct directly from available balance on approval
    if (user.balance < wr.amount) return res.status(400).json({ success: false, message: 'Insufficient user balance' });
    user.balance -= wr.amount;
    await user.save();

    wr.status = 'approved';
    wr.approvedBy = req.adminId;
    wr.approvedAt = new Date();
    await wr.save();

    res.json({ success: true, message: 'Withdrawal approved', data: { request: wr, user: { balance: user.balance, freezeBalance: user.freezeBalance } } });
  } catch (e) {
    console.error('Approve withdrawal error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject withdrawal request
router.post('/withdrawal-requests/:id/reject', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const wr = await WithdrawalRequest.findById(id).populate('userId');
    if (!wr) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    if (wr.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    // No balance changes on rejection (since nothing was deducted yet)
    const user = wr.userId;

    wr.status = 'rejected';
    wr.rejectionReason = reason || 'Rejected by admin';
    wr.approvedBy = req.adminId;
    wr.approvedAt = new Date();
    await wr.save();

    res.json({ success: true, message: 'Withdrawal rejected', data: { request: wr, user: user ? { balance: user.balance, freezeBalance: user.freezeBalance } : undefined } });
  } catch (e) {
    console.error('Reject withdrawal error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get comprehensive dashboard statistics
router.get('/dashboard/stats', verifyAdminToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Previous period for trend calculation
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get total users yesterday for trend
    const totalUsersYesterday = await User.countDocuments({
      createdAt: { $lt: startOfDay }
    });
    const totalUsersTrend = totalUsersYesterday > 0 ? 
      ((totalUsers - totalUsersYesterday) / totalUsersYesterday * 100).toFixed(1) : 0;

    // Get active users (users who have made deposits)
    const activeUsers = await User.countDocuments({ totalDeposited: { $gt: 0 } });
    
    // Get active users yesterday for trend
    const activeUsersYesterday = await User.countDocuments({
      totalDeposited: { $gt: 0 },
      createdAt: { $lt: startOfDay }
    });
    const activeUsersTrend = activeUsersYesterday > 0 ? 
      ((activeUsers - activeUsersYesterday) / activeUsersYesterday * 100).toFixed(1) : 0;

    // Get pending deposit requests count
    const pendingDeposits = await DepositRequest.countDocuments({ status: 'pending' });
    
    // Get today's deposit requests count
    const todayDeposits = await DepositRequest.countDocuments({
      status: 'approved',
      approvedAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    // Get yesterday's deposit requests for trend
    const yesterdayDeposits = await DepositRequest.countDocuments({
      status: 'approved',
      approvedAt: { $gte: startOfYesterday, $lt: endOfYesterday }
    });
    const todayDepositsTrend = yesterdayDeposits > 0 ? 
      ((todayDeposits - yesterdayDeposits) / yesterdayDeposits * 100).toFixed(1) : 0;

    // Get total deposit amount today
    const todayDepositAmount = await DepositRequest.aggregate([
      {
        $match: {
          status: 'approved',
          approvedAt: { $gte: startOfDay, $lt: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get yesterday's deposit amount for trend
    const yesterdayDepositAmount = await DepositRequest.aggregate([
      {
        $match: {
          status: 'approved',
          approvedAt: { $gte: startOfYesterday, $lt: endOfYesterday }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const todayAmount = todayDepositAmount[0]?.totalAmount || 0;
    const yesterdayAmount = yesterdayDepositAmount[0]?.totalAmount || 0;
    const todayAmountTrend = yesterdayAmount > 0 ? 
      ((todayAmount - yesterdayAmount) / yesterdayAmount * 100).toFixed(1) : 0;

    // Get total commission paid today
    const Order = require('../models/Order');
    const todayCommission = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          orderDate: { $gte: startOfDay, $lt: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$commissionAmount' }
        }
      }
    ]);

    // Get yesterday's commission for trend
    const yesterdayCommission = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          orderDate: { $gte: startOfYesterday, $lt: endOfYesterday }
        }
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$commissionAmount' }
        }
      }
    ]);
    
    const todayCommissionAmount = todayCommission[0]?.totalCommission || 0;
    const yesterdayCommissionAmount = yesterdayCommission[0]?.totalCommission || 0;
    const todayCommissionTrend = yesterdayCommissionAmount > 0 ? 
      ((todayCommissionAmount - yesterdayCommissionAmount) / yesterdayCommissionAmount * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalUsersTrend: parseFloat(totalUsersTrend),
        activeUsers,
        activeUsersTrend: parseFloat(activeUsersTrend),
        pendingDeposits,
        todayDeposits,
        todayDepositsTrend: parseFloat(todayDepositsTrend),
        todayAmount,
        todayAmountTrend: parseFloat(todayAmountTrend),
        todayCommission: todayCommissionAmount,
        todayCommissionTrend: parseFloat(todayCommissionTrend)
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get weekly revenue data for chart
router.get('/dashboard/weekly-revenue', verifyAdminToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    const revenueData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      
      const dayRevenue = await DepositRequest.aggregate([
        {
          $match: {
            status: 'approved',
            approvedAt: { $gte: dayStart, $lt: dayEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);
      
      revenueData.push({
        name: days[i],
        value: dayRevenue[0]?.totalAmount || 0
      });
    }

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Get weekly revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get user growth data for chart (last 6 months)
router.get('/dashboard/user-growth', verifyAdminToken, async (req, res) => {
  try {
    const today = new Date();
    const userGrowthData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const newUsers = await User.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      
      userGrowthData.push({
        name: months[monthStart.getMonth()],
        users: newUsers
      });
    }

    res.json({
      success: true,
      data: userGrowthData
    });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get recent users for dashboard table
router.get('/dashboard/recent-users', verifyAdminToken, async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('fullName email vipLevel isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedUsers = recentUsers.map(user => ({
      id: user._id,
      name: user.fullName,
      email: user.email,
      vip: user.vipLevel.replace('vip-', 'VIP ').replace('royal-vip', 'Royal VIP').replace('svip', 'SVIP'),
      status: user.isActive ? 'Active' : 'Inactive',
      joinDate: user.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Get recent users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// =====================
// Users Management (CRUD)
// Base path: /api/admin/users
// Guarded by verifyAdminToken
// =====================

// List users with pagination, search, sorting
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      q = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status // optional: 'active' | 'inactive'
    } = req.query;

    const query = {};
    if (q) {
      const like = new RegExp(q, 'i');
      query.$or = [
        { fullName: like },
        { email: like },
        { phoneNumber: like }
      ];
    }
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// Orders Management
// =====================

// Admin: Get all orders with pagination, search, and filtering
router.get('/orders', verifyAdminToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      status = 'all',
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Search by order ID, user name, email, or product name
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { productName: searchRegex },
        { brand: searchRegex }
      ];
    }

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Get orders with user information
    const orders = await Order.find(query)
      .populate('userId', 'fullName email phoneNumber')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderId: `ORD-${order.orderDate.toISOString().split('T')[0].replace(/-/g, '')}-${order._id.toString().slice(-3).toUpperCase()}`,
      user: {
        name: order.userId?.fullName || 'Unknown User',
        email: order.userId?.email || 'No email',
        phoneNumber: order.userId?.phoneNumber || 'No phone'
      },
      product: {
        name: order.productName,
        image: order.image || '',
        brand: order.brand || '',
        category: order.category || ''
      },
      amount: order.productPrice,
      commission: order.commissionAmount,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      orderDate: formatDateVN(order.orderDate),
      deliveryDate: order.completedAt ? formatDateVN(order.completedAt) : null,
      commissionRate: order.commissionRate,
      productId: order.productId
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get single order details
router.get('/orders/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Guard: if param is not a valid ObjectId, return 400
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const order = await Order.findById(id)
      .populate('userId', 'fullName email phoneNumber balance totalDeposited vipLevel');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const formattedOrder = {
      id: order._id,
      orderId: `ORD-${order.orderDate.toISOString().split('T')[0].replace(/-/g, '')}-${order._id.toString().slice(-3).toUpperCase()}`,
      user: {
        name: order.userId?.fullName || 'Unknown User',
        email: order.userId?.email || 'No email',
        phoneNumber: order.userId?.phoneNumber || 'No phone',
        balance: order.userId?.balance || 0,
        totalDeposited: order.userId?.totalDeposited || 0,
        vipLevel: order.userId?.vipLevel || 'vip-0'
      },
      product: {
        name: order.productName,
        image: order.image || '',
        brand: order.brand || '',
        category: order.category || '',
        id: order.productId
      },
      amount: order.productPrice,
      commission: order.commissionAmount,
      commissionRate: order.commissionRate,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      orderDate: formatDateVN(order.orderDate),
      deliveryDate: order.completedAt ? formatDateVN(order.completedAt) : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.json({ success: true, data: { order: formattedOrder } });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Update order status (pending -> processing -> shipped -> delivered/cancelled)
router.patch('/orders/:id/status', verifyAdminToken, async (req, res) => {
  try {
    const { status } = req.body || {};
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;

    // Handle status-specific logic
    if (status === 'delivered' && !order.completedAt) {
      order.completedAt = new Date();
      // Credit user commission when order is delivered
      const user = await User.findById(order.userId);
      if (user) {
        user.balance += order.commissionAmount;
        user.commission += order.commissionAmount;
        await user.save();
      }
    }

    await order.save();

    res.json({ 
      success: true, 
      message: `Order status updated from ${oldStatus} to ${status}`,
      data: { 
        order: {
          id: order._id,
          status: order.status,
          completedAt: order.completedAt
        }
      } 
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get order statistics
router.get('/orders/stats', verifyAdminToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's orders
    const todayOrders = await Order.find({
      orderDate: { $gte: startOfDay, $lt: endOfDay }
    });

    // Get total orders
    const totalOrders = await Order.countDocuments();

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total revenue and commission
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$productPrice' },
          totalCommission: { $sum: '$commissionAmount' }
        }
      }
    ]);

    // Get today's revenue and commission
    const todayRevenueStats = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startOfDay, $lt: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: '$productPrice' },
          todayCommission: { $sum: '$commissionAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders: todayOrders.length,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        totalCommission: revenueStats[0]?.totalCommission || 0,
        todayRevenue: todayRevenueStats[0]?.todayRevenue || 0,
        todayCommission: todayRevenueStats[0]?.todayCommission || 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single user by id
router.get('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create user
router.post('/users', verifyAdminToken, async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      password, 
      vipLevel = 'vip-0',
      balance = 0, 
      isActive = true 
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'fullName, email and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or phone number already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      password,
      vipLevel,
      balance,
      isActive
    });

    res.status(201).json({ success: true, data: { user: user.toJSON() } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user (basic fields; password optional)
// Business rule: balance cannot decrease via this endpoint.
// If balance increases, treat the delta as a manual deposit (adds to totalDeposited and updates VIP).
router.put('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      password, 
      vipLevel,
      balance,
      isActive 
    } = req.body;
    
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (vipLevel !== undefined) updates.vipLevel = vipLevel;
    // Allow admin to set commission configuration atomically
    if (req.body.commissionConfig !== undefined) {
      updates['commissionConfig'] = req.body.commissionConfig;
    }
    // Fetch existing user to compare balance
    const currentUser = await User.findById(req.params.id);
    console.log('[ADMIN PUT USER] current', {
      id: req.params.id,
      balance: currentUser?.balance,
      totalDeposited: currentUser?.totalDeposited
    });
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prepare one atomic update operation
    let atomicUpdate = { $set: {}, $inc: {} };
    let balanceIncrease = null;

    // Handle balance update using the same logic as user deposit
    if (balance !== undefined) {
      const newBalance = Number(balance);
      if (isNaN(newBalance)) {
        return res.status(400).json({ success: false, message: 'Invalid balance' });
      }
      if (newBalance < currentUser.balance) {
        return res.status(400).json({ success: false, message: 'Balance decrease is not allowed' });
      }
      const delta = newBalance - currentUser.balance;
      console.log('[ADMIN PUT USER] Balance update - current:', currentUser.balance, 'new:', newBalance, 'delta:', delta);
      
      // If balance increased, use addDeposit method (same as user deposit logic)
      if (delta > 0) {
        console.log('[ADMIN PUT USER] Using addDeposit method for delta:', delta);
        // Store delta separately, don't add to updates object
        balanceIncrease = delta;
      } else {
        // Just update balance if no increase
        atomicUpdate.$set.balance = newBalance;
      }
    }
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    // Merge non-balance fields into $set
    Object.assign(atomicUpdate.$set, updates);
    if (!Object.keys(atomicUpdate.$inc).length) delete atomicUpdate.$inc;
    console.log('[ADMIN PUT USER] atomicUpdate', JSON.stringify(atomicUpdate));
    
    // Update user with non-balance fields first
    const user = await User.findByIdAndUpdate(req.params.id, atomicUpdate, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Handle balance increase using addDeposit method (same as user deposit)
    if (balanceIncrease && balanceIncrease > 0) {
      console.log('[ADMIN PUT USER] Applying balance increase using addDeposit method:', balanceIncrease);
      const upgradeInfo = user.addDeposit(balanceIncrease);
      console.log('[ADMIN PUT USER] addDeposit result:', { 
        balance: user.balance, 
        totalDeposited: user.totalDeposited, 
        vipLevel: user.vipLevel,
        upgradeInfo 
      });
    }
    
    await user.save();
    console.log('[ADMIN PUT USER] final result', { balance: user.balance, totalDeposited: user.totalDeposited, vipLevel: user.vipLevel });
    res.json({ success: true, data: { user: user.toJSON() } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Explicit admin topup endpoint: POST /api/admin/users/:id/topup { amount }
router.post('/users/:id/topup', verifyAdminToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const add = Number(amount);
    if (!add || isNaN(add) || add <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.balance += add;
    user.totalDeposited += add;
    user.updateVipLevel();
    await user.save();

    // Create a deposit request record marked as approved immediately
    const depositRequest = await DepositRequest.create({
      userId: user._id,
      amount: add,
      status: 'approved',
      approvedBy: req.adminId,
      approvedAt: new Date(),
      notes: 'Admin top up'
    });

    res.json({
      success: true,
      message: 'Top up successful',
      data: {
        user: user.toJSON(),
        added: add,
        depositRequestId: depositRequest._id
      }
    });
  } catch (e) {
    console.error('Admin topup error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Toggle active status
router.patch('/users/:id/status', verifyAdminToken, async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean is required' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Commission config: get
router.get('/users/:id/commission-config', verifyAdminToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('commissionConfig dailyEarnings');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { commissionConfig: user.commissionConfig, dailyEarnings: user.dailyEarnings } });
  } catch (e) {
    console.error('Get commission config error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Commission config: update
router.patch('/users/:id/commission-config', verifyAdminToken, async (req, res) => {
  try {
    const { commissionConfig } = req.body || {};
    if (!commissionConfig || typeof commissionConfig !== 'object') {
      return res.status(400).json({ success: false, message: 'commissionConfig object is required' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.commissionConfig = {
      ...user.commissionConfig?.toObject?.() || user.commissionConfig || {},
      ...commissionConfig
    };
    await user.save();
    res.json({ success: true, message: 'Commission config updated', data: { commissionConfig: user.commissionConfig } });
  } catch (e) {
    console.error('Update commission config error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user (hard delete)
router.delete('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    console.log('Delete user request received:', {
      userId: req.params.id,
      adminId: req.adminId,
      headers: req.headers
    });
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User deleted successfully:', user._id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
