const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const DepositRequest = require('../models/DepositRequest');
const { getVipLevelByAmount } = require('../config/vipLevels');
const config = require('../config');

const router = express.Router();

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

// Get admin dashboard stats
router.get('/dashboard', verifyAdminToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get pending deposit requests count
    const pendingRequests = await DepositRequest.countDocuments({ status: 'pending' });
    
    // Get today's approved requests
    const todayApproved = await DepositRequest.countDocuments({
      status: 'approved',
      approvedAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get active users (users who have made deposits)
    const activeUsers = await User.countDocuments({ totalDeposited: { $gt: 0 } });

    // Get total deposit amount today
    const todayDeposits = await DepositRequest.aggregate([
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

    // Get total commission paid today
    const Order = require('../models/Order');
    const todayOrders = await Order.aggregate([
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

    // Get VIP level distribution
    const vipDistribution = await User.aggregate([
      {
        $group: {
          _id: '$vipLevel',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        pendingRequests,
        todayApproved,
        totalUsers,
        activeUsers,
        todayDepositAmount: todayDeposits[0]?.totalAmount || 0,
        todayCommissionPaid: todayOrders[0]?.totalCommission || 0,
        vipDistribution
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

// Delete user (hard delete)
router.delete('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
