const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: Number,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },
  commissionRate: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  brand: { type: String },
  category: { type: String },
  image: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
