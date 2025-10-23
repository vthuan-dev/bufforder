const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Optional idempotency key provided by client to prevent duplicate orders
  clientRequestId: {
    type: String,
    required: false,
    index: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Generate order number: ASH + timestamp + random 3 digits
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `ASH${timestamp.slice(-8)}${random}`;
    }
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
    enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
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
// Ensure (userId, clientRequestId) uniqueness when clientRequestId exists
orderSchema.index(
  { userId: 1, clientRequestId: 1 },
  { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string' } } }
);

module.exports = mongoose.model('Order', orderSchema);
