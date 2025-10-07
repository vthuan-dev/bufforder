const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const http = require('http');
const { Server } = require('socket.io');

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
const io = new Server(server, {
  cors: { 
    origin: [
      'http://localhost:3000',
      'https://bufforder-1m9b.vercel.app',
      'https://bufforder.vercel.app'
    ], 
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }
});
// expose io to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', // Local development
    'https://bufforder-1m9b.vercel.app', // Vercel frontend
    'https://bufforder.vercel.app' // Alternative Vercel URL
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
// Handle preflight
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// serve ảnh upload
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
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
});
