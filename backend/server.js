const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const http = require('http');
const { Server } = require('socket.io');
const MessageCleanupService = require('./services/messageCleanup');

const { verifyToken } = require('./middleware/auth');
const Admin = require('./models/Admin');
const ChatThread = require('./models/ChatThread');
const ChatMessage = require('./models/ChatMessage');

// Import routes
const authRoutes = require('./routes/auth');
const vipRoutes = require('./routes/vip');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
// CORS allow-list: localhost, *.vercel.app, custom domains and env-configured origins
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const STATIC_ALLOWED = new Set([
  'http://localhost:3000',
  'https://localhost:3000',
  'https://ashford.click',
  'https://www.ashford.click'
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow same-origin/server-to-server
  if (STATIC_ALLOWED.has(origin)) return true;
  if (/\.vercel\.app$/i.test(origin)) return true; // any Vercel preview/prod
  if (envAllowed.includes(origin)) return true; // extra origins via env
  return false;
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Idempotency-Key']
  }
});
// expose io to routes    
app.set('io', io);
// Presence store: track online users (by userId) and connection counts
const onlineUsers = new Map(); // userId -> count
app.set('onlineUsers', onlineUsers);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Idempotency-Key']
}));
// Handle preflight
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// serve ảnh upload
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
// Disable HTTP caching for API JSON responses to avoid stale data (balances etc.)
app.disable('etag');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  // Fix legacy unique index on email that allowed null duplicates to fail
  try {
    const User = require('./models/User');
    // Drop old unique index if it exists, then sync new partial index from schema
    User.collection.dropIndex('email_1')
      .then(() => console.log('[index] Dropped legacy index email_1'))
      .catch(() => {} )
      .finally(() => {
        User.syncIndexes()
          .then(() => console.log('[index] User indexes synced'))
          .catch((e) => console.warn('[index] syncIndexes warning', e?.message));
      });
  } catch (e) {
    console.warn('[index] User index maintenance skipped', e?.message);
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO auth: supports user (JWT via Bearer) and admin (adminToken)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    const adminToken = socket.handshake.auth?.adminToken;
    if (!token && !adminToken) return next(new Error('Unauthorized'));

    if (adminToken) {
      // simple admin jwt verify using config secret
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(adminToken, config.JWT_SECRET);
      socket.data.role = 'admin';
      socket.data.adminId = decoded.adminId;
      return next();
    }

    // verify user token (reuse existing middleware util)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.data.role = 'user';
    socket.data.userId = decoded.userId;
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log('[socket] connected', { role: socket.data.role, userId: socket.data.userId, adminId: socket.data.adminId });
  // join personal rooms
  if (socket.data.role === 'user') {
    socket.join(`user:${socket.data.userId}`);
    // mark user online (increment connection count)
    const uid = String(socket.data.userId);
    const current = onlineUsers.get(uid) || 0;
    onlineUsers.set(uid, current + 1);
    try { io.to('admins').emit('presence:update', { userId: uid, online: true }); } catch {}
  } else if (socket.data.role === 'admin') {
    socket.join('admins');
  }

  socket.on('chat:joinThread', (threadId) => {
    if (threadId) socket.join(`thread:${threadId}`);
  });

  socket.on('chat:send', async ({ threadId, text }) => {
    console.log('[socket] chat:send received', {
      role: socket.data.role,
      userId: socket.data.userId,
      adminId: socket.data.adminId,
      threadId,
      text
    });
    try {
      if (!text) return;
      // if no thread, create for user
      let thread = null;
      if (!threadId && socket.data.role === 'user') {
        thread = await ChatThread.findOne({ userId: socket.data.userId, status: 'open' });
        if (!thread) thread = await ChatThread.create({ userId: socket.data.userId });
        threadId = thread._id;
      } else {
        thread = await ChatThread.findById(threadId);
      }
      if (!thread) return;
      // Attempt to record IP on thread if missing
      try {
        if (!thread.userIp) {
          const rawIp = (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '').toString();
          const ip = rawIp.split(',')[0].trim();
          if (ip) {
            thread.userIp = ip;
          }
        }
      } catch {}

      const senderType = socket.data.role === 'admin' ? 'admin' : 'user';
      const senderId = socket.data.role === 'admin' ? socket.data.adminId : socket.data.userId;
      const msg = await ChatMessage.create({ threadId, senderType, senderId, text });
      console.log('[socket] message saved', { messageId: msg._id, threadId });

      // update counters
      thread.lastMessageAt = new Date();
      thread.lastMessageText = text;
      if (senderType === 'user') {
        thread.unreadForAdmin += 1;
      } else {
        thread.unreadForUser += 1;
      }
      await thread.save();
      console.log('[socket] thread updated', { threadId, lastMessageText: text });

      io.to(`thread:${threadId}`).emit('chat:message', {
        _id: msg._id,
        threadId,
        senderType,
        text,
        createdAt: msg.createdAt
      });
      console.log('[socket] chat:message emitted to', `thread:${threadId}`);

      // notify admins and the user room
      io.to('admins').emit('chat:threadUpdated', { threadId, lastMessageText: text, lastMessageAt: thread.lastMessageAt });
      io.to(`user:${thread.userId}`).emit('chat:threadUpdated', { threadId, lastMessageText: text, lastMessageAt: thread.lastMessageAt });
      console.log('[socket] threadUpdated emitted to admins and user room');
    } catch (e) {
      console.error('socket send error', e);
    }
  });

  // Typing indicator: broadcast to thread room without persisting
  socket.on('chat:typing', ({ threadId, typing }) => {
    try {
      if (!threadId) return;
      const senderType = socket.data.role === 'admin' ? 'admin' : 'user';
      io.to(`thread:${threadId}`).emit('chat:typing', { threadId, typing: !!typing, senderType });
    } catch {}
  });

  socket.on('disconnect', () => {
    if (socket.data.role === 'user' && socket.data.userId) {
      const uid = String(socket.data.userId);
      const current = onlineUsers.get(uid) || 0;
      if (current <= 1) {
        onlineUsers.delete(uid);
        // update lastSeenAt for user
        try {
          const User = require('./models/User');
          User.findByIdAndUpdate(uid, { lastSeenAt: new Date() }).exec().catch(() => {});
        } catch {}
        try { io.to('admins').emit('presence:update', { userId: uid, online: false }); } catch {}
      } else {
        onlineUsers.set(uid, current - 1);
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Lỗi server. Vui lòng thử lại sau.'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

const PORT = config.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:3000`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  
  // Start message cleanup service
  const cleanupService = new MessageCleanupService();
  cleanupService.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    cleanupService.stop();
    process.exit(0);
  });
});
