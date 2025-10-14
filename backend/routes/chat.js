const express = require('express');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../config');
let upload; // cấu hình upload có thể tắt nếu thiếu dependency
try {
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });
  upload = multer({ storage });
} catch (e) {
  upload = { single: () => (req, res) => res.status(501).json({ success: false, message: 'Image upload chưa được bật (thiếu multer).'} ) };
}

const router = express.Router();

// Simple admin guard using Authorization: Bearer <adminToken>
const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Admin token required' });
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (!decoded.adminId) return res.status(401).json({ success: false, message: 'Invalid admin token' });
    req.adminId = decoded.adminId;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};

// User: open or get existing thread
router.post('/thread', authenticateToken, async (req, res) => {
  try {
    let thread = await ChatThread.findOne({ userId: req.userId, status: 'open' });
    if (!thread) {
      // capture user IP (behind proxies use x-forwarded-for)
      const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
      const ip = rawIp.split(',')[0].trim();
      thread = await ChatThread.create({ userId: req.userId, userIp: ip });
    } else if (!thread.userIp) {
      const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
      const ip = rawIp.split(',')[0].trim();
      thread.userIp = ip;
      await thread.save();
    }
    res.json({ success: true, data: { threadId: thread._id } });
  } catch (e) {
    console.error('open thread error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User: list my messages
router.get('/thread/:id/messages', authenticateToken, async (req, res) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread || String(thread.userId) !== String(req.userId)) return res.status(404).json({ success: false, message: 'Thread not found' });
    const messages = await ChatMessage.find({ threadId: thread._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: { messages } });
  } catch (e) {
    console.error('list messages error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User: send message (REST fallback)
router.post('/thread/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const thread = await ChatThread.findById(req.params.id);
    if (!thread || String(thread.userId) !== String(req.userId)) return res.status(404).json({ success: false, message: 'Thread not found' });
    const msg = await ChatMessage.create({ threadId: thread._id, senderType: 'user', senderId: req.userId, text });
    thread.lastMessageAt = new Date();
    thread.lastMessageText = text;
    thread.unreadForAdmin += 1;
    await thread.save();
    res.json({ success: true, data: { message: msg } });
  } catch (e) {
    console.error('send message error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: list threads
router.get('/admin/threads', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '' } = req.query;
    const query = {};
    if (q) query.lastMessageText = new RegExp(q, 'i');
    const threads = await ChatThread.find(query)
      .populate('userId', 'fullName username email phoneNumber')
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await ChatThread.countDocuments(query);
    // attach presence (online) info for each thread user
    try {
      const onlineUsers = req.app.get('onlineUsers');
      const threadsWithPresence = threads.map((t) => ({
        ...t.toObject(),
        userOnline: onlineUsers?.has(String(t.userId?._id)) || false
      }));
      return res.json({ success: true, data: { threads: threadsWithPresence, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
    } catch {
      return res.json({ success: true, data: { threads, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
    }
  } catch (e) {
    console.error('admin list threads error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: list messages in thread
router.get('/admin/threads/:id/messages', verifyAdmin, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ threadId: req.params.id }).sort({ createdAt: 1 });
    res.json({ success: true, data: { messages } });
  } catch (e) {
    console.error('admin list messages error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: send message
router.post('/admin/threads/:id/messages', verifyAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    const msg = await ChatMessage.create({ threadId: thread._id, senderType: 'admin', senderId: req.adminId, text });
    thread.lastMessageAt = new Date();
    thread.lastMessageText = text;
    thread.unreadForUser += 1;
    await thread.save();
    // emit realtime to thread room and user room
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${thread._id}`).emit('chat:message', { _id: msg._id, threadId: thread._id, senderType: 'admin', text, createdAt: msg.createdAt });
        io.to(`user:${thread.userId}`).emit('chat:threadUpdated', { threadId: thread._id, lastMessageText: text, lastMessageAt: thread.lastMessageAt });
      }
    } catch {}
    res.json({ success: true, data: { message: msg } });
  } catch (e) {
    console.error('admin send message error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// Admin: gửi ảnh
router.post('/admin/threads/:id/images', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const msg = await ChatMessage.create({ threadId: thread._id, senderType: 'admin', senderId: req.adminId, imageUrl });
    thread.lastMessageAt = new Date();
    thread.lastMessageText = '[image]';
    thread.unreadForUser += 1;
    await thread.save();
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${thread._id}`).emit('chat:message', { _id: msg._id, threadId: thread._id, senderType: 'admin', imageUrl, text: '', createdAt: msg.createdAt });
        io.to('admins').emit('chat:threadUpdated', { threadId: thread._id, lastMessageText: '[image]', lastMessageAt: thread.lastMessageAt });
        io.to(`user:${thread.userId}`).emit('chat:threadUpdated', { threadId: thread._id, lastMessageText: '[image]', lastMessageAt: thread.lastMessageAt });
      }
    } catch {}
    res.json({ success: true, data: { message: msg, imageUrl } });
  } catch (e) {
    console.error('admin send image error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Admin: mark thread as read (clear unread counter for admin)
router.post('/admin/threads/:id/read', verifyAdmin, async (req, res) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    thread.unreadForAdmin = 0;
    await thread.save();
    res.json({ success: true });
  } catch (e) {
    console.error('admin mark read error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: delete a thread and its messages
router.delete('/admin/threads/:id', verifyAdmin, async (req, res) => {
  try {
    const threadId = req.params.id;
    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    await ChatMessage.deleteMany({ threadId });
    await ChatThread.deleteOne({ _id: threadId });

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${threadId}`).emit('chat:threadDeleted', { threadId });
      }
    } catch {}

    res.json({ success: true });
  } catch (e) {
    console.error('admin delete thread error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: get user info by phone number
router.get('/admin/users/by-phone/:phone', verifyAdmin, async (req, res) => {
  try {
    const { phone } = req.params;
    const User = require('../models/User');
    const user = await User.findOne({ phoneNumber: phone }).select('fullName username email phoneNumber');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (e) {
    console.error('admin get user by phone error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User: gửi ảnh
router.post('/thread/:id/images', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread || String(thread.userId) !== String(req.userId)) return res.status(404).json({ success: false, message: 'Thread not found' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const msg = await ChatMessage.create({ threadId: thread._id, senderType: 'user', senderId: req.userId, imageUrl });
    thread.lastMessageAt = new Date();
    thread.lastMessageText = '[image]';
    thread.unreadForAdmin += 1;
    await thread.save();
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${thread._id}`).emit('chat:message', { _id: msg._id, threadId: thread._id, senderType: 'user', imageUrl, text: '', createdAt: msg.createdAt });
        io.to('admins').emit('chat:threadUpdated', { threadId: thread._id, lastMessageText: '[image]', lastMessageAt: thread.lastMessageAt });
        io.to(`user:${thread.userId}`).emit('chat:threadUpdated', { threadId: thread._id, lastMessageText: '[image]', lastMessageAt: thread.lastMessageAt });
      }
    } catch {}
    res.json({ success: true, data: { message: msg, imageUrl } });
  } catch (e) {
    console.error('user send image error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;


