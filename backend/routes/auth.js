const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const config = require('../config');
const { hashPassword, comparePassword, excludeFromUser } = require('../lib/utils');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '7d' });
};

// Register endpoint with invite code
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, password, fullName, inviteCode } = req.body;

    // Validation
    if (!phoneNumber || !password || !fullName || !inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all information and enter the member code'
      });
    }

    // Check invite code (single or list)
    const allowedCodes = new Set([config.INVITE_CODE, ...(config.INVITE_CODES || [])]);
    if (!allowedCodes.has(inviteCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member code'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already in use'
      });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        password: hashedPassword,
        fullName,
        inviteCodeUsed: inviteCode
      }
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: excludeFromUser(user),
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Validation
    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter phone number and password'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Phone number or password is incorrect'
      });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Phone number or password is incorrect'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: excludeFromUser(user),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        addresses: true,
        bankCards: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found'
      });
    }

    res.json({
      success: true,
      data: {
        user: excludeFromUser(user)
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const { fullName, email } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      include: {
        addresses: true,
        bankCards: true
      }
    });

    res.json({
      success: true,
      message: 'Update profile successful',
      data: {
        user: excludeFromUser(user)
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get addresses endpoint
router.get('/addresses', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const addresses = await prisma.address.findMany({
      where: { userId: decoded.userId },
      orderBy: { isDefault: 'desc' } // Default addresses first
    });

    res.json({
      success: true,
      data: {
        addresses
      }
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Add address endpoint
router.post('/address', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const { fullName, phoneNumber, addressLine1, city, postalCode, isDefault } = req.body;

    // Validation
    if (!fullName || !phoneNumber || !addressLine1 || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all information'
      });
    }

    // Check if user already has 3 addresses
    const addressCount = await prisma.address.count({
      where: { userId: decoded.userId }
    });

    if (addressCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You can only save a maximum of 3 addresses'
      });
    }

    // If this is the first address or user wants to set as default, make it default
    const shouldBeDefault = isDefault || addressCount === 0;

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        // Remove default from all other addresses
        await tx.address.updateMany({
          where: { userId: decoded.userId },
          data: { isDefault: false }
        });
      }

      // Create new address
      const newAddress = await tx.address.create({
        data: {
          userId: decoded.userId,
          fullName,
          phoneNumber,
          addressLine1,
          city,
          postalCode,
          isDefault: shouldBeDefault
        }
      });

      // Get all addresses
      const allAddresses = await tx.address.findMany({
        where: { userId: decoded.userId },
        orderBy: { isDefault: 'desc' }
      });

      return { newAddress, allAddresses };
    });

    res.json({
      success: true,
      message: 'Add address successful',
      data: {
        address: result.newAddress,
        addresses: result.allAddresses
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Delete address endpoint
router.delete('/address/:addressId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const { addressId } = req.params;

    // Find address to ensure it belongs to the user
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: decoded.userId
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'No address found'
      });
    }

    // Use transaction for atomicity
    const addresses = await prisma.$transaction(async (tx) => {
      // Delete the address
      await tx.address.delete({
        where: { id: addressId }
      });

      // If deleted address was default, set first remaining address as default
      if (address.isDefault) {
        const firstAddress = await tx.address.findFirst({
          where: { userId: decoded.userId },
          orderBy: { id: 'asc' }
        });

        if (firstAddress) {
          await tx.address.update({
            where: { id: firstAddress.id },
            data: { isDefault: true }
          });
        }
      }

      // Get all remaining addresses
      return tx.address.findMany({
        where: { userId: decoded.userId },
        orderBy: { isDefault: 'desc' }
      });
    });

    res.json({
      success: true,
      message: 'Delete address successful',
      data: {
        addresses
      }
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Invalid token' });

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) return res.status(404).json({ success: false, message: 'No user found' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing currentPassword or newPassword' });
    }

    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    console.error('Change password error:', e);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
