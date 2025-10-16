const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getVipLevelByAmount } = require('../config/vipLevels');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  vipLevel: {
    type: String,
    default: 'vip-0',
    enum: ['vip-0', 'vip-1', 'vip-2', 'vip-3', 'vip-4', 'vip-5', 'vip-6', 'vip-7', 'svip', 'royal-vip']
  },
  totalDeposited: {
    type: Number,
    default: 0.00
  },
  balance: {
    type: Number,
    default: 0.00
  },
  freezeBalance: {
    type: Number,
    default: 0.00
  },
  commission: {
    type: Number,
    default: 0.00
  },
  // Per-user commission configuration
  commissionConfig: {
    // Base commission rate override (percent). If set, overrides VIP rate
    baseRate: { type: Number, default: null },
    // Daily profit mode: 'auto' | 'low' | 'high'. 'auto' lets system randomize
    dailyProfitMode: { type: String, enum: ['auto', 'low', 'high'], default: 'auto' },
    // Target daily profit ranges for low/high modes, in absolute USD
    lowTarget: {
      min: { type: Number, default: 450 },
      max: { type: Number, default: 600 }
    },
    highTarget: {
      min: { type: Number, default: 800 },
      max: { type: Number, default: 1000 }
    },
    // Percentage of each order’s price used for commission when targets not enforced
    orderRate: { type: Number, default: null }
  },
  // Track per-day earnings to steer toward target ranges
  dailyEarnings: {
    dateKey: { type: String, default: null }, // YYYY-MM-DD
    totalCommission: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    mode: { type: String, enum: ['low', 'high'], default: null },
    targetTotal: { type: Number, default: 0 }
  },
  lastSeenAt: {
    type: Date,
    default: null
  },
  inviteCodeUsed: {
    type: String,
    default: null
  },
  bankCards: [{
    id: { type: String, required: true },
    bankName: { type: String, required: true },
    cardNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  addresses: [{
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Ensure unique email only when email exists and is a string
// Avoid duplicate key on null by using partial filter expression
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $type: 'string' } } }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update VIP level based on total deposited amount
userSchema.methods.updateVipLevel = function() {
  const newVipLevel = getVipLevelByAmount(this.totalDeposited);
  if (newVipLevel && newVipLevel.id !== this.vipLevel) {
    this.vipLevel = newVipLevel.id;
    return newVipLevel;
  } else if (!newVipLevel && this.vipLevel !== 'vip-0') {
    // User no longer qualifies for any VIP level, set to VIP 0
    this.vipLevel = 'vip-0';
    return null;
  }
  return null;
};

// Method to add deposit and update VIP level
userSchema.methods.addDeposit = function(amount) {
  const oldVipLevel = this.vipLevel;
  this.totalDeposited += amount;
  this.balance += amount;
  
  const newVipLevel = this.updateVipLevel();
  
  // Return upgrade information
  return {
    newVipLevel,
    oldVipLevel,
    upgraded: newVipLevel !== null && newVipLevel.id !== oldVipLevel
  };
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
