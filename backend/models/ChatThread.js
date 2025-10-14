const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userIp: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageText: { type: String },
    unreadForAdmin: { type: Number, default: 0 },
    unreadForUser: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatThread', chatThreadSchema);


