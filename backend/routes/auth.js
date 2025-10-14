const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

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
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already in use' 
      });
    }

    // Create new user
    const user = new User({
      phoneNumber,
      password,
      fullName,
      inviteCodeUsed: inviteCode
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
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
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Phone number or password is incorrect' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Phone number or password is incorrect' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found' 
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found' 
      });
    }

    const { fullName, email } = req.body;
    
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      message: 'Update profile successful',
      data: {
        user: user.toJSON()
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        addresses: user.addresses
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found' 
      });
    }

    const { fullName, phoneNumber, addressLine1, city, postalCode, isDefault } = req.body;
    
    // Validation
    if (!fullName || !phoneNumber || !addressLine1 || !city || !postalCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all information' 
      });
    }

    // Check if user already has 3 addresses
    if (user.addresses.length >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only save a maximum of 3 addresses' 
      });
    }

    // If this is the first address or user wants to set as default, make it default
    const shouldBeDefault = isDefault || user.addresses.length === 0;
    
    if (shouldBeDefault) {
      // Remove default from all other addresses
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Add new address
    const newAddress = {
      fullName,
      phoneNumber,
      addressLine1,
      city,
      postalCode,
      isDefault: shouldBeDefault
    };
    
    user.addresses.push(newAddress);
    await user.save();
    
    res.json({
      success: true,
      message: 'Add address successful',
      data: {
        address: newAddress,
        addresses: user.addresses
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found' 
      });
    }

    const { addressId } = req.params;
    
    // Find and remove address
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'No address found' 
      });
    }

    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);
    
    // If deleted address was default and there are other addresses, set first one as default
    if (deletedAddress.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Delete address successful',
      data: {
        addresses: user.addresses
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
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'No user found' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Missing currentPassword or newPassword' });
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    if (String(newPassword).length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    user.password = newPassword; // hashed by pre-save hook
    await user.save();
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    console.error('Change password error:', e);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
