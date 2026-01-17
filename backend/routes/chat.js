const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../config');

let upload;
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
  upload = { single: () => (req, res) => res.status(501).json({ success: false, message: 'Image upload not enabled' }) };
}

const router = express.Router();

// Admin guard
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
    // Verify user exists first
    const userExists = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true }
    });

    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    let thread = await prisma.chatThread.findFirst({
      where: { userId: req.userId },
      orderBy: [{ updatedAt: 'desc' }, { lastMessageAt: 'desc' }]
    });

    if (!thread) {
      const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
      const ip = rawIp.split(',')[0].trim();
      thread = await prisma.chatThread.create({
        data: { userId: req.userId, userIp: ip }
      });
    } else if (!thread.userIp) {
      const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
      const ip = rawIp.split(',')[0].trim();
      thread = await prisma.chatThread.update({
        where: { id: thread.id },
        data: { userIp: ip }
      });
    }

    res.json({ success: true, data: { threadId: thread.id } });
  } catch (e) {
    console.error('open thread error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User: list my messages (excluding deleted ones)
router.get('/thread/:id/messages', authenticateToken, async (req, res) => {
  try {
    const thread = await prisma.chatThread.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    const messages = await prisma.chatMessage.findMany({
      where: {
        threadId: thread.id,
        isDeletedForUser: false
      },
      orderBy: { createdAt: 'asc' }
    });
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
    const thread = await prisma.chatThread.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    console.log('[REST] 💾 Saving message via user API:', { threadId: thread.id, text });
    const msg = await prisma.chatMessage.create({
      data: { threadId: thread.id, senderType: 'user', senderId: req.userId, text }
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: text,
        unreadForAdmin: { increment: 1 }
      }
    });

    // Emit realtime
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${thread.id}`).emit('chat:message', {
          _id: msg.id,
          threadId: thread.id,
          senderType: 'user',
          text,
          createdAt: msg.createdAt
        });
        io.to('admins').emit('chat:threadUpdated', { threadId: thread.id, lastMessageText: text, lastMessageAt: new Date() });
      }
    } catch { }

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

    const where = q ? { lastMessageText: { contains: q } } : {};

    const threads = await prisma.chatThread.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true, lastSeenAt: true } }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.chatThread.count({ where });

    // Attach presence info
    const onlineUsers = req.app.get('onlineUsers');
    const threadsWithPresence = threads.map(t => ({
      ...t,
      userId: t.user,
      userOnline: onlineUsers?.has(t.user?.id) || false,
      userLastSeenAt: t.user?.lastSeenAt || null
    }));

    res.json({
      success: true,
      data: {
        threads: threadsWithPresence,
        pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
      }
    });
  } catch (e) {
    console.error('admin list threads error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: list messages in thread
router.get('/admin/threads/:id/messages', verifyAdmin, async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { threadId: req.params.id },
      orderBy: { createdAt: 'asc' }
    });
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
    const thread = await prisma.chatThread.findUnique({ where: { id: req.params.id } });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    const msg = await prisma.chatMessage.create({
      data: { threadId: thread.id, senderType: 'admin', senderId: req.adminId, text }
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: text,
        unreadForUser: { increment: 1 }
      }
    });

    // Emit realtime
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${thread.id}`).emit('chat:message', { _id: msg.id, threadId: thread.id, senderType: 'admin', text, createdAt: msg.createdAt });
        io.to(`user:${thread.userId}`).emit('chat:threadUpdated', { threadId: thread.id, lastMessageText: text, lastMessageAt: new Date() });
      }
    } catch { }

    res.json({ success: true, data: { message: msg } });
  } catch (e) {
    console.error('admin send message error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: send image
router.post('/admin/threads/:id/images', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const thread = await prisma.chatThread.findUnique({ where: { id: req.params.id } });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const msg = await prisma.chatMessage.create({
      data: { threadId: thread.id, senderType: 'admin', senderId: req.adminId, imageUrl }
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: '[image]',
        unreadForUser: { increment: 1 }
      }
    });

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${thread.id}`).emit('chat:message', { _id: msg.id, threadId: thread.id, senderType: 'admin', imageUrl, text: '', createdAt: msg.createdAt });
        io.to('admins').emit('chat:threadUpdated', { threadId: thread.id, lastMessageText: '[image]', lastMessageAt: new Date() });
      }
    } catch { }

    res.json({ success: true, data: { message: msg, imageUrl } });
  } catch (e) {
    console.error('admin send image error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: mark thread as read
router.post('/admin/threads/:id/read', verifyAdmin, async (req, res) => {
  try {
    await prisma.chatThread.update({
      where: { id: req.params.id },
      data: { unreadForAdmin: 0 }
    });
    res.json({ success: true });
  } catch (e) {
    console.error('admin mark read error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: delete thread
router.delete('/admin/threads/:id', verifyAdmin, async (req, res) => {
  try {
    const threadId = req.params.id;

    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { threadId } }),
      prisma.chatThread.delete({ where: { id: threadId } })
    ]);

    try {
      const io = req.app.get('io');
      if (io) io.to(`thread:${threadId}`).emit('chat:threadDeleted', { threadId });
    } catch { }

    res.json({ success: true });
  } catch (e) {
    console.error('admin delete thread error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: block/unblock user from chat
router.post('/admin/threads/:id/block', verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const thread = await prisma.chatThread.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, fullName: true, isChatBlocked: true } } }
    });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    const newBlockedStatus = !thread.user.isChatBlocked;

    await prisma.user.update({
      where: { id: thread.userId },
      data: {
        isChatBlocked: newBlockedStatus,
        chatBlockedAt: newBlockedStatus ? new Date() : null,
        chatBlockedReason: newBlockedStatus ? (reason || 'Blocked by admin') : null
      }
    });

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${thread.userId}`).emit('chat:blocked', { blocked: newBlockedStatus });
      }
    } catch { }

    res.json({
      success: true,
      data: {
        blocked: newBlockedStatus,
        userId: thread.userId,
        userName: thread.user.fullName
      }
    });
  } catch (e) {
    console.error('admin block user error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: get thread details with user block status
router.get('/admin/threads/:id', verifyAdmin, async (req, res) => {
  try {
    const thread = await prisma.chatThread.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            isChatBlocked: true,
            chatBlockedAt: true,
            chatBlockedReason: true
          }
        }
      }
    });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    res.json({ success: true, data: { thread } });
  } catch (e) {
    console.error('admin get thread error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: get user by phone
router.get('/admin/users/by-phone/:phone', verifyAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: req.params.phone },
      select: { id: true, fullName: true, email: true, phoneNumber: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (e) {
    console.error('admin get user by phone error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: delete messages for user
router.post('/admin/users/:userId/delete-messages', verifyAdmin, async (req, res) => {
  try {
    const threads = await prisma.chatThread.findMany({
      where: { userId: req.params.userId },
      select: { id: true }
    });

    const result = await prisma.chatMessage.updateMany({
      where: { threadId: { in: threads.map(t => t.id) } },
      data: { isDeletedForUser: true, deletedForUserAt: new Date() }
    });

    res.json({ success: true, data: { deletedCount: result.count } });
  } catch (e) {
    console.error('admin delete user messages error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User: send image
router.post('/thread/:id/images', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const thread = await prisma.chatThread.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const msg = await prisma.chatMessage.create({
      data: { threadId: thread.id, senderType: 'user', senderId: req.userId, imageUrl }
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: '[image]',
        unreadForAdmin: { increment: 1 }
      }
    });

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`thread:${thread.id}`).emit('chat:message', { _id: msg.id, threadId: thread.id, senderType: 'user', imageUrl, text: '', createdAt: msg.createdAt });
        io.to('admins').emit('chat:threadUpdated', { threadId: thread.id, lastMessageText: '[image]', lastMessageAt: new Date() });
      }
    } catch { }

    res.json({ success: true, data: { message: msg, imageUrl } });
  } catch (e) {
    console.error('user send image error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
