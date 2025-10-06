const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true },
    senderType: { type: String, enum: ['user', 'admin'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    readByAdmin: { type: Boolean, default: false },
    readByUser: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);


