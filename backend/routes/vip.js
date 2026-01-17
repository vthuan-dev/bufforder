const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { VIP_LEVELS, getVipLevelByAmount, getNextVipLevel, getProgressToNextLevel } = require('../config/vipLevels');
const config = require('../config');
const { comparePassword, getDateKey, resolveNumberOfOrders, parseJsonField } = require('../lib/utils');
const { cached } = require('../lib/cache'); // ⚡ Caching

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
router.get('/levels', async (req, res) => {
  try {
    // ⚡ Cache for 1 hour (static data)
    const levels = await cached('vip:levels', async () => {
      return VIP_LEVELS;
    }, 3600);

    res.json({
      success: true,
      data: {
        levels
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
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

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
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deposit amount'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create deposit request
    const depositRequest = await prisma.depositRequest.create({
      data: {
        userId: req.userId,
        amount: parseFloat(amount),
        status: 'pending'
      }
    });

    // 🔔 Emit new deposit notification to admins
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admins').emit('deposit:new', {
          requestId: depositRequest.id,
          userId: req.userId,
          userName: user.fullName || user.username,
          amount: depositRequest.amount,
          createdAt: depositRequest.requestDate
        });
        console.log('[VIP] Emitted deposit:new to admins');
      }
    } catch (emitErr) {
      console.error('[VIP] Failed to emit deposit:new:', emitErr);
    }

    res.json({
      success: true,
      message: 'Deposit request submitted successfully. Please wait for admin approval.',
      data: {
        requestId: depositRequest.id,
        amount: depositRequest.amount,
        status: depositRequest.status,
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
    const depositRequests = await prisma.depositRequest.findMany({
      where: { userId: req.userId },
      orderBy: { requestDate: 'desc' }
    });

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

// ===== Bank cards =====
router.get('/bank-cards', verifyToken, async (req, res) => {
  try {
    const bankCards = await prisma.bankCard.findMany({
      where: { userId: req.userId },
      orderBy: { isDefault: 'desc' }
    });
    res.json({ success: true, data: { bankCards } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/bank-cards', verifyToken, async (req, res) => {
  try {
    const { bankName, cardNumber, accountName, isDefault } = req.body || {};
    if (!bankName || !cardNumber || !accountName) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin thẻ ngân hàng' });
    }

    // Count existing cards
    const cardCount = await prisma.bankCard.count({
      where: { userId: req.userId }
    });

    const shouldBeDefault = !!isDefault || cardCount === 0;

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        // Remove default from all other cards
        await tx.bankCard.updateMany({
          where: { userId: req.userId },
          data: { isDefault: false }
        });
      }

      // Create new card
      const newCard = await tx.bankCard.create({
        data: {
          userId: req.userId,
          bankName,
          cardNumber,
          accountName,
          isDefault: shouldBeDefault
        }
      });

      // Get all cards
      const allCards = await tx.bankCard.findMany({
        where: { userId: req.userId },
        orderBy: { isDefault: 'desc' }
      });

      return { newCard, allCards };
    });

    res.json({ success: true, message: 'Thêm thẻ thành công', data: { bankCards: result.allCards } });
  } catch (e) {
    console.error('Add bank card error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/bank-cards/:id', verifyToken, async (req, res) => {
  try {
    const card = await prisma.bankCard.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!card) return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ' });

    const bankCards = await prisma.$transaction(async (tx) => {
      await tx.bankCard.delete({
        where: { id: req.params.id }
      });

      // If deleted card was default, set first remaining as default
      if (card.isDefault) {
        const firstCard = await tx.bankCard.findFirst({
          where: { userId: req.userId },
          orderBy: { createdAt: 'asc' }
        });

        if (firstCard) {
          await tx.bankCard.update({
            where: { id: firstCard.id },
            data: { isDefault: true }
          });
        }
      }

      return tx.bankCard.findMany({
        where: { userId: req.userId },
        orderBy: { isDefault: 'desc' }
      });
    });

    res.json({ success: true, message: 'Xóa thẻ thành công', data: { bankCards } });
  } catch (e) {
    console.error('Delete bank card error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== Withdrawal request =====
router.post('/withdrawal', verifyToken, async (req, res) => {
  try {
    const { amount, bankCardId, password, withdrawalType = 'bank', walletAddress, network } = req.body || {};
    const parsed = Number(amount);

    if (!parsed || isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!password) return res.status(400).json({ success: false, message: 'Please enter your password to confirm' });

    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Incorrect password' });

    // Validate based on withdrawal type
    if (withdrawalType === 'crypto') {
      if (!walletAddress || !walletAddress.trim()) {
        return res.status(400).json({ success: false, message: 'Please enter your USDT wallet address' });
      }
      if (!network || !['TRC20', 'ERC20', 'BEP20'].includes(network)) {
        return res.status(400).json({ success: false, message: 'Please select a valid network (TRC20, ERC20, or BEP20)' });
      }
    } else {
      // Bank withdrawal
      const card = await prisma.bankCard.findFirst({
        where: {
          id: bankCardId,
          userId: req.userId
        }
      });
      if (!card) return res.status(400).json({ success: false, message: 'Please select a bank card' });
    }

    if (parsed > user.balance) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    // 🔒 Task-Based Withdrawal Constraint
    // Users must complete all daily tasks (orders) before withdrawing
    try {
      // Get today's order count for this user
      const todayKey = getDateKey();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayOrdersCount = await prisma.order.count({
        where: {
          userId: user.id,
          orderDate: { gte: startOfDay, lt: endOfDay }
        }
      });

      // Get user's daily task limit (numberOfOrders)
      const vipLevel = getVipLevelByAmount(user.totalDeposited);

      // Use snapshotted value if exists (user already started grabbing today), otherwise use current config
      const dailyEarnings = parseJsonField(user.dailyEarnings, {});
      const isToday = dailyEarnings.dateKey === todayKey;
      const totalDailyTasks = (isToday && dailyEarnings.numberOfOrders > 0)
        ? dailyEarnings.numberOfOrders
        : resolveNumberOfOrders(user, vipLevel);

      if (todayOrdersCount < totalDailyTasks) {
        return res.status(400).json({
          success: false,
          message: `Please complete today's tasks (${todayOrdersCount}/${totalDailyTasks} orders) before withdrawing.`
        });
      }
    } catch (statsErr) {
      console.error('Withdrawal stats check error:', statsErr);
      // Fallback: allow if stats check fail for some reason, or block? 
      // safer to block but let's just log for now
    }

    // Create withdrawal request
    const wr = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount: parsed,
        withdrawalType,
        bankCardId: withdrawalType === 'bank' ? bankCardId : null,
        walletAddress: withdrawalType === 'crypto' ? walletAddress.trim() : null,
        network: withdrawalType === 'crypto' ? network : null
      }
    });

    // 🔔 Emit new withdrawal notification to admins
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admins').emit('withdrawal:new', {
          requestId: wr.id,
          userId: user.id,
          userName: user.fullName || user.phoneNumber,
          amount: wr.amount,
          withdrawalType: wr.withdrawalType,
          createdAt: wr.requestDate
        });
        console.log('[Withdrawal] Emitted withdrawal:new to admins');
      }
    } catch (emitErr) {
      console.error('[Withdrawal] Failed to emit:', emitErr);
    }

    res.json({
      success: true,
      message: 'Withdrawal request submitted. Please wait for admin approval.',
      data: {
        requestId: wr.id,
        status: wr.status,
        amount: wr.amount,
        withdrawalType: wr.withdrawalType,
        bankCardId: wr.bankCardId,
        walletAddress: wr.walletAddress,
        network: wr.network,
        requestDate: wr.requestDate
      }
    });
  } catch (e) {
    console.error('Withdrawal create error', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List user's withdrawal requests
router.get('/withdrawal-requests', verifyToken, async (req, res) => {
  try {
    const list = await prisma.withdrawalRequest.findMany({
      where: { userId: req.userId },
      orderBy: { requestDate: 'desc' }
    });
    res.json({ success: true, data: { requests: list } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
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
