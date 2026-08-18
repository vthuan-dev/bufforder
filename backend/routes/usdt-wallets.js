const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');

// Middleware to verify user token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Validate USDT wallet address
function validateWalletAddress(address, network) {
  if (network === 'TRC20') {
    // TRC20 (Tron): 34 characters, starts with 'T'
    return /^T[A-Za-z0-9]{33}$/.test(address);
  } else if (network === 'Solana') {
    // Solana: Base58, 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } else if (['ERC20', 'BEP20', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'].includes(network)) {
    // EVM-compatible chains: 42 characters, starts with '0x'
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  return false;
}

// GET /api/usdt-wallets - Get user's USDT wallets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wallets = await prisma.usdtWallet.findMany({
      where: { userId: req.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: { usdtWallets: wallets }
    });
  } catch (error) {
    console.error('Get USDT wallets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wallets' });
  }
});

// POST /api/usdt-wallets - Add new USDT wallet
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { walletAddress, walletName, network, isDefault } = req.body;

    // Validation
    if (!walletAddress || !walletName || !network) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!['TRC20', 'ERC20', 'BEP20', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'Solana'].includes(network)) {
      return res.status(400).json({ success: false, message: 'Invalid network' });
    }

    if (!validateWalletAddress(walletAddress, network)) {
      const errorMessages = {
        'TRC20': 'Invalid TRC20 address. Must start with T and be 34 characters',
        'Solana': 'Invalid Solana address. Must be Base58 format (32-44 characters)',
        'default': `Invalid ${network} address. Must start with 0x and be 42 characters`
      };
      
      return res.status(400).json({
        success: false,
        message: errorMessages[network] || errorMessages['default']
      });
    }

    // Check if wallet already exists
    const existing = await prisma.usdtWallet.findFirst({
      where: {
        userId: req.userId,
        walletAddress: walletAddress
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'This wallet address already exists' });
    }

    // If this is the first wallet or isDefault is true, set as default
    const walletCount = await prisma.usdtWallet.count({
      where: { userId: req.userId }
    });

    const shouldBeDefault = walletCount === 0 || isDefault === true;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      await prisma.usdtWallet.updateMany({
        where: { userId: req.userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create new wallet
    await prisma.usdtWallet.create({
      data: {
        userId: req.userId,
        walletAddress,
        walletName,
        network,
        isDefault: shouldBeDefault
      }
    });

    // Return updated list
    const wallets = await prisma.usdtWallet.findMany({
      where: { userId: req.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      message: 'Wallet added successfully',
      data: { usdtWallets: wallets }
    });
  } catch (error) {
    console.error('Add USDT wallet error:', error);
    res.status(500).json({ success: false, message: 'Failed to add wallet' });
  }
});

// PUT /api/usdt-wallets/:id/default - Set wallet as default
router.put('/:id/default', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify wallet belongs to user
    const wallet = await prisma.usdtWallet.findFirst({
      where: { id, userId: req.userId }
    });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    // Unset all defaults
    await prisma.usdtWallet.updateMany({
      where: { userId: req.userId, isDefault: true },
      data: { isDefault: false }
    });

    // Set this one as default
    await prisma.usdtWallet.update({
      where: { id },
      data: { isDefault: true }
    });

    // Return updated list
    const wallets = await prisma.usdtWallet.findMany({
      where: { userId: req.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      message: 'Default wallet updated',
      data: { usdtWallets: wallets }
    });
  } catch (error) {
    console.error('Set default wallet error:', error);
    res.status(500).json({ success: false, message: 'Failed to update default wallet' });
  }
});

// DELETE /api/usdt-wallets/:id - Delete wallet
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify wallet belongs to user
    const wallet = await prisma.usdtWallet.findFirst({
      where: { id, userId: req.userId }
    });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    const wasDefault = wallet.isDefault;

    // Delete wallet
    await prisma.usdtWallet.delete({
      where: { id }
    });

    // If deleted wallet was default, set another as default
    if (wasDefault) {
      const remaining = await prisma.usdtWallet.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });

      if (remaining) {
        await prisma.usdtWallet.update({
          where: { id: remaining.id },
          data: { isDefault: true }
        });
      }
    }

    // Return updated list
    const wallets = await prisma.usdtWallet.findMany({
      where: { userId: req.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      message: 'Wallet deleted successfully',
      data: { usdtWallets: wallets }
    });
  } catch (error) {
    console.error('Delete USDT wallet error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete wallet' });
  }
});

module.exports = router;
