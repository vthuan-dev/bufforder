const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userIp: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessageText: { type: String },
    unreadForAdmin: { type: Number, default: 0 },
    unreadForUser: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
  },
  { timestamps: true }
);

chatThreadSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('ChatThread', chatThreadSchema);


