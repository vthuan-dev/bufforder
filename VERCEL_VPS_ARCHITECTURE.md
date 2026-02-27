# 🏗️ Kiến Trúc: Frontend (Vercel) + Backend (VPS)

## 📊 Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐   ┌──────────────────┐
        │   USER BROWSER    │   │  ADMIN BROWSER   │
        │                   │   │                  │
        │  bufforder.com    │   │  bufforder.com   │
        └───────────────────┘   └──────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
        ╔═══════════════════════════════════════════╗
        ║         VERCEL CDN (Global)               ║
        ║  https://bufforder.vercel.app             ║
        ╠═══════════════════════════════════════════╣
        ║  ✅ Frontend (React + Vite)               ║
        ║  ✅ Static Files (HTML, CSS, JS)          ║
        ║  ✅ Auto Build from GitHub                ║
        ║  ✅ Free SSL Certificate                  ║
        ║  ✅ CDN toàn cầu (nhanh)                  ║
        ╚═══════════════════════════════════════════╝
                              │
                              │ API Calls
                              │ (HTTP + WebSocket)
                              ▼
        ╔═══════════════════════════════════════════╗
        ║         VPS (180.93.35.4)                 ║
        ║  http://180.93.35.4:5000                  ║
        ╠═══════════════════════════════════════════╣
        ║  ✅ Backend API (Node.js + Express)       ║
        ║  ✅ Socket.IO (Real-time Chat)            ║
        ║  ✅ PM2 (Process Manager)                 ║
        ║  ✅ MySQL Database                        ║
        ╚═══════════════════════════════════════════╝
                              │
                              ▼
                    ┌──────────────────┐
                    │  MySQL Database  │
                    │  greeting_message│
                    └──────────────────┘
```

---

## 🔄 Flow Hoạt Động Chi Tiết

### 1️⃣ User Truy Cập Website

```
User nhập URL: https://bufforder.vercel.app
         │
         ▼
Vercel CDN (gần nhất với user)
         │
         ▼
Trả về HTML, CSS, JS (React App)
         │
         ▼
Browser render React App
```

**Thời gian:** ~100-300ms (rất nhanh vì CDN)

---

### 2️⃣ User Login

```
User nhập phone + password
         │
         ▼
React App gọi API
         │
         ▼
POST https://bufforder.vercel.app/api/auth/login
         │
         ▼
Vercel proxy request đến VPS
         │
         ▼
VPS Backend (180.93.35.4:5000)
         │
         ├─► Check MySQL database
         │   └─► Verify password (bcrypt)
         │
         ├─► Generate JWT token
         │
         └─► Return { token, user }
         │
         ▼
React App lưu token vào localStorage
         │
         ▼
Redirect to HomePage
```

**Thời gian:** ~500-1000ms

---

### 3️⃣ User Nhận Order

```
User click "Nhận Order"
         │
         ▼
React App gọi API với JWT token
         │
         ▼
POST http://180.93.35.4:5000/api/orders/take
Headers: { Authorization: Bearer <token> }
         │
         ▼
VPS Backend
         │
         ├─► Verify JWT token
         │
         ├─► Check user balance (MySQL)
         │
         ├─► Calculate commission
         │
         ├─► Create order (MySQL transaction)
         │   ├─► INSERT INTO Order
         │   └─► UPDATE User balance
         │
         └─► Return order data
         │
         ▼
React App update UI
         │
         └─► Show success message
```

**Thời gian:** ~300-500ms

---

### 4️⃣ Real-time Chat (Socket.IO)

```
User mở Help Page (Chat)
         │
         ▼
React App connect Socket.IO
         │
         ▼
const socket = io('http://180.93.35.4:5000', {
    auth: { token: userToken }
})
         │
         ▼
VPS Backend Socket.IO Server
         │
         ├─► Verify JWT token
         │
         ├─► Join room: 'user:123'
         │
         └─► Listen for events
         │
         ▼
User gửi message
         │
         ▼
socket.emit('chat:send', { text: 'Hello' })
         │
         ▼
VPS Backend
         │
         ├─► Save to MySQL (ChatMessage)
         │
         ├─► Broadcast to admin room
         │   └─► io.to('admins').emit('chat:message')
         │
         └─► Emit back to user
             └─► socket.emit('chat:message')
         │
         ▼
React App hiển thị message real-time
```

**Thời gian:** ~50-100ms (real-time)

---

## 🌐 Request Flow Diagram

```
┌──────────────┐
│ User Browser │
│ (Vercel CDN) │
└──────┬───────┘
       │
       │ 1. Load static files (HTML, CSS, JS)
       │    ✅ Fast (CDN)
       │
       ▼
┌──────────────┐
│  React App   │
│  (Frontend)  │
└──────┬───────┘
       │
       │ 2. API Calls
       │    GET /api/vip/info
       │    POST /api/orders/take
       │    GET /api/orders/stats
       │
       ▼
┌──────────────────────┐
│  VPS Backend         │
│  180.93.35.4:5000    │
│                      │
│  ┌────────────────┐  │
│  │ Express Server │  │
│  │   + Routes     │  │
│  │   + Socket.IO  │  │
│  └────────┬───────┘  │
│           │          │
│           ▼          │
│  ┌────────────────┐  │
│  │ MySQL Database │  │
│  │ greeting_message│ │
│  └────────────────┘  │
└──────────────────────┘
```

---

## 📡 API Endpoints Flow

### HTTP Requests (REST API)

```
Frontend (Vercel)                    Backend (VPS)
─────────────────                    ─────────────

GET /api/vip/info          ────────► Express Route
                                     │
                                     ├─► Verify JWT
                                     │
                                     ├─► Query MySQL
                                     │
                                     └─► Return JSON
                           ◄────────

POST /api/orders/take      ────────► Express Route
                                     │
                                     ├─► Verify JWT
                                     │
                                     ├─► Business Logic
                                     │
                                     ├─► MySQL Transaction
                                     │
                                     └─► Return JSON
                           ◄────────
```

### WebSocket (Socket.IO)

```
Frontend (Vercel)                    Backend (VPS)
─────────────────                    ─────────────

socket.connect()           ────────► Socket.IO Server
                                     │
                                     ├─► Verify JWT
                                     │
                                     └─► Join room
                           ◄────────

socket.emit('chat:send')   ────────► Socket.IO Handler
                                     │
                                     ├─► Save to MySQL
                                     │
                                     └─► Broadcast
                           ◄────────
socket.on('chat:message')
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
└─────────────────────────────────────────────────────────┘

1. HTTPS (Vercel)
   ├─► Free SSL certificate
   └─► Encrypted connection

2. CORS (Backend)
   ├─► Only allow Vercel domain
   └─► Block unauthorized origins

3. JWT Authentication
   ├─► Token in localStorage
   ├─► Sent in Authorization header
   └─► Verified on every request

4. Password Security
   ├─► Bcrypt hashing (10 rounds)
   └─► Never stored in plain text

5. Database Security
   ├─► Prepared statements (Prisma)
   └─► SQL injection protection
```

---

## 💰 Chi Phí & Performance

### Vercel (Frontend)
```
✅ FREE Plan:
   - 100GB bandwidth/month
   - Unlimited deployments
   - Auto SSL
   - Global CDN
   - Fast build (2-3 phút)

📊 Performance:
   - Load time: 100-300ms
   - CDN: Global (gần user)
   - Uptime: 99.99%
```

### VPS (Backend)
```
💵 Cost: ~$5-10/month
   - 1GB RAM (đủ cho backend + MySQL)
   - 1 CPU core
   - 20GB SSD

📊 Performance:
   - API response: 100-500ms
   - Socket.IO: 50-100ms
   - Uptime: 99.9% (với PM2)
```

---

## 🚀 Deployment Flow

### Frontend (Vercel)

```
1. Push code to GitHub
   └─► git push origin main

2. Vercel auto detect
   └─► Webhook triggered

3. Vercel build
   ├─► npm install
   ├─► npm run build
   └─► Deploy to CDN

4. Live in 2-3 minutes
   └─► https://bufforder.vercel.app
```

### Backend (VPS)

```
1. SSH to VPS
   └─► ssh root@180.93.35.4

2. Pull latest code
   └─► git pull

3. Restart backend
   └─► pm2 restart greeting-backend

4. Live immediately
   └─► http://180.93.35.4:5000
```

---

## 🔄 Update Flow

### Update Frontend
```
1. Sửa code frontend
2. git commit + push
3. Vercel auto deploy (2-3 phút)
4. Done! ✅
```

### Update Backend
```
1. Sửa code backend
2. git commit + push
3. SSH vào VPS
4. git pull
5. pm2 restart greeting-backend
6. Done! ✅
```

---

## 🎯 Ưu Điểm Kiến Trúc Này

### ✅ Performance
- Frontend: CDN toàn cầu (nhanh)
- Backend: Dedicated VPS (stable)
- Database: Local to backend (low latency)

### ✅ Cost-Effective
- Frontend: FREE (Vercel)
- Backend: $5-10/month (VPS)
- Total: ~$5-10/month

### ✅ Scalability
- Frontend: Auto scale (Vercel)
- Backend: Có thể upgrade VPS
- Database: Có thể migrate sang RDS

### ✅ Development
- Frontend: Auto deploy from GitHub
- Backend: Full control
- Easy to debug

### ✅ Security
- Frontend: HTTPS (free SSL)
- Backend: Firewall + JWT
- Database: Private network

---

## 🔧 Configuration Required

### 1. Frontend (.env)
```env
VITE_API_URL=http://180.93.35.4:5000
```

### 2. Backend (server.js)
```javascript
const STATIC_ALLOWED = new Set([
  'https://bufforder.vercel.app',
  'https://bufforder-*.vercel.app'  // Preview deployments
]);
```

### 3. Vercel (Environment Variables)
```
VITE_API_URL = http://180.93.35.4:5000
```

---

## 📊 Monitoring

### Frontend (Vercel Dashboard)
- Deployment status
- Build logs
- Analytics
- Error tracking

### Backend (VPS)
```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs greeting-backend

# Status
pm2 status
```

---

## 🎉 Kết Luận

Kiến trúc này:
- ✅ **Tối ưu chi phí** (Frontend free)
- ✅ **Performance cao** (CDN + VPS)
- ✅ **Dễ maintain** (Auto deploy + PM2)
- ✅ **Scalable** (Có thể mở rộng)
- ✅ **Secure** (HTTPS + JWT + CORS)

**Perfect cho production! 🚀**
