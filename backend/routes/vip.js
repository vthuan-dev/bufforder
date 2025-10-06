const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DepositRequest = require('../models/DepositRequest');
const { VIP_LEVELS, getVipLevelByAmount, getNextVipLevel, getProgressToNextLevel } = require('../config/vipLevels');
const config = require('../config');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token không hợp lệ' 
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token không hợp lệ' 
    });
  }
};

// Get all VIP levels
router.get('/levels', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        levels: VIP_LEVELS
      }
    });
  } catch (error) {
    console.error('Get VIP levels error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server. Vui lòng thử lại sau.' 
    });
  }
});

// Get user's current VIP level and progress
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng' 
      });
    }

    const currentLevel = getVipLevelByAmount(user.totalDeposited);
    let nextLevel = null;
    let progress = { progress: 0, remaining: 0 };
    
    if (currentLevel) {
      nextLevel = getNextVipLevel(currentLevel);
      progress = getProgressToNextLevel(currentLevel, user.totalDeposited);
    } else {
      // User doesn't have any VIP level yet, show progress to VIP 1
      const vip1Level = VIP_LEVELS.find(level => level.id === 'vip-1');
      if (vip1Level) {
        nextLevel = vip1Level;
        progress = {
          progress: (user.totalDeposited / vip1Level.amountRequired) * 100,
          remaining: vip1Level.amountRequired - user.totalDeposited
        };
      }
    }

    res.json({
      success: true,
      data: {
        currentLevel,
        nextLevel,
        progress,
        totalDeposited: user.totalDeposited,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error('Get VIP status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server. Vui lòng thử lại sau.' 
    });
  }
});

// Request deposit (requires admin approval)
router.post('/deposit', verifyToken, async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { amount } = req.body;
    
    console.log('Deposit request - amount:', amount, 'type:', typeof amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      console.log('Validation failed - amount:', amount, 'isNaN:', isNaN(amount), '<= 0:', amount <= 0);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid deposit amount' 
      });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Create deposit request
    const depositRequest = new DepositRequest({
      userId: req.userId,
      amount: amount,
      status: 'pending'
    });

    await depositRequest.save();

    res.json({
      success: true,
      message: 'Deposit request submitted successfully. Please wait for admin approval.',
      data: {
        requestId: depositRequest._id,
        amount: amount,
        status: 'pending',
        requestDate: depositRequest.requestDate
      }
    });

  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Get user's deposit requests
router.get('/deposit-requests', verifyToken, async (req, res) => {
  try {
    const depositRequests = await DepositRequest.find({ userId: req.userId })
      .sort({ requestDate: -1 })
      .populate('approvedBy', 'username email');

    res.json({
      success: true,
      data: {
        requests: depositRequests
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

// Get VIP level by amount (for testing)
router.get('/level/:amount', (req, res) => {
  try {
    const amount = parseFloat(req.params.amount);
    
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Số tiền không hợp lệ' 
      });
    }

    const level = getVipLevelByAmount(amount);
    const nextLevel = getNextVipLevel(level);
    const progress = getProgressToNextLevel(level, amount);

    res.json({
      success: true,
      data: {
        amount,
        currentLevel: level,
        nextLevel,
        progress
      }
    });

  } catch (error) {
    console.error('Get VIP level error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server. Vui lòng thử lại sau.' 
    });
  }
});

module.exports = router;
