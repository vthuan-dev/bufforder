# 🔄 Project Flow - Greeting Message Platform

## 📋 Tổng Quan Flow

Dự án này là một **nền tảng thương mại điện tử với hệ thống VIP và hoa hồng**. Users nhận orders, kiếm commission, và nâng cấp VIP level.

---

## 🎯 Main Flows

### 1. 👤 User Registration & Login Flow

```
┌─────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                     │
└─────────────────────────────────────────────────────────┘

1. User mở app → Click "Register"
   ↓
2. Nhập thông tin:
   - Phone number (unique)
   - Full name
   - Password (min 6 chars)
   - Invite code (required)
   ↓
3. Frontend gửi POST /api/auth/register
   ↓
4. Backend validate:
   ✓ Phone number chưa tồn tại
   ✓ Invite code hợp lệ (ASHFORD2024 hoặc codes khác)
   ✓ Password đủ mạnh
   ↓
5. Backend tạo user trong database:
   - Hash password (bcrypt)
   - Set VIP level = "vip-0"
   - Set balance = 0
   - Generate JWT token (7 days)
   ↓
6. Return token + user info
   ↓
7. Frontend lưu token vào localStorage
   ↓
8. Redirect to Home page
```

**Login Flow:**
```
1. User nhập phone + password
   ↓
2. POST /api/auth/login
   ↓
3. Backend verify password
   ↓
4. Return JWT token
   ↓
5. Save token → Redirect to Home
```

---

### 2. 💰 Deposit & VIP Upgrade Flow

```
┌─────────────────────────────────────────────────────────┐
│                    DEPOSIT FLOW                          │
└─────────────────────────────────────────────────────────┘

1. User click "Top Up" (Nạp tiền)
   ↓
2. Nhập số tiền muốn nạp
   ↓
3. POST /api/vip/deposit
   {
     amount: 1000
   }
   ↓
4. Backend tạo DepositRequest:
   - userId: user.id
   - amount: 1000
   - status: "pending"
   ↓
5. User chờ admin duyệt
   ↓
6. Admin vào Admin Panel → Deposits tab
   ↓
7. Admin click "Approve"
   ↓
8. Backend xử lý:
   ┌─────────────────────────────────────┐
   │ TRANSACTION (ACID)                  │
   ├─────────────────────────────────────┤
   │ 1. Update DepositRequest:           │
   │    - status = "approved"            │
   │    - approvedBy = adminId           │
   │    - approvedAt = now()             │
   │                                     │
   │ 2. Update User:                     │
   │    - balance += amount              │
   │    - totalDeposited += amount       │
   │                                     │
   │ 3. Check VIP upgrade:               │
   │    - Calculate new VIP level        │
   │    - Update vipLevel if qualified   │
   └─────────────────────────────────────┘
   ↓
9. User nhận notification
   ↓
10. Balance updated + VIP upgraded (nếu đủ điều kiện)
```

**VIP Level Calculation:**
```javascript
totalDeposited >= $100,000  → Royal VIP
totalDeposited >= $50,000   → SVIP
totalDeposited >= $20,000   → VIP 7
totalDeposited >= $10,000   → VIP 6
totalDeposited >= $5,000    → VIP 5
totalDeposited >= $3,000    → VIP 4
totalDeposited >= $1,000    → VIP 3
totalDeposited >= $500      → VIP 2
totalDeposited >= $100      → VIP 1
totalDeposited < $100       → VIP 0
```

---

### 3. 📦 Order Taking & Commission Flow

```
┌─────────────────────────────────────────────────────────┐
│                    ORDER FLOW                            │
└─────────────────────────────────────────────────────────┘

1. User vào "Orders" tab
   ↓
2. Click "Take Order" (Nhận đơn)
   ↓
3. Frontend random chọn 1 product từ list
   ↓
4. POST /api/orders/take
   {
     product: {
       id: 123,
       name: "iPhone 15 Pro",
       price: 999,
       brand: "Apple",
       category: "Electronics",
       image: "url"
     },
     idempotencyKey: "unique-key" // Prevent duplicates
   }
   ↓
5. Backend validate:
   ✓ User có đủ balance >= product.price
   ✓ Chưa vượt quá 100 orders/day
   ✓ Không duplicate (check idempotency key)
   ↓
6. Backend calculate commission:
   ┌─────────────────────────────────────┐
   │ COMMISSION CALCULATION              │
   ├─────────────────────────────────────┤
   │ 1. Get user's VIP level             │
   │    VIP 0 → $5/order                 │
   │    VIP 1 → $8/order                 │
   │    VIP 3 → $18/order                │
   │    etc.                             │
   │                                     │
   │ 2. Add randomness (±10%)            │
   │    commission = baseRate × (0.9-1.1)│
   │                                     │
   │ 3. Check daily target cap           │
   │    VIP 0 → max $50/day              │
   │    VIP 1 → max $80/day              │
   │    etc.                             │
   │                                     │
   │ 4. If exceeded daily target:        │
   │    commission = 0                   │
   └─────────────────────────────────────┘
   ↓
7. Backend create order + update user:
   ┌─────────────────────────────────────┐
   │ TRANSACTION (ACID)                  │
   ├─────────────────────────────────────┤
   │ 1. Create Order:                    │
   │    - orderNumber = "ASH..."         │
   │    - productPrice = 999             │
   │    - commissionAmount = 18          │
   │    - status = "pending"             │
   │                                     │
   │ 2. Update User:                     │
   │    - balance += (commission × 0.8)  │
   │    - commission += commission       │
   │    - dailyEarnings.totalCommission++│
   │    - dailyEarnings.ordersCount++    │
   └─────────────────────────────────────┘
   ↓
8. Return order info + new balance
   ↓
9. Frontend update UI:
   - Show order details
   - Update balance
   - Update commission
   - Update daily progress
```

**Daily Reset:**
```
Mỗi ngày mới (00:00):
- dailyEarnings reset về 0
- ordersCount reset về 0
- User có thể nhận orders mới
```

---

### 4. 💸 Withdrawal Flow

```
┌─────────────────────────────────────────────────────────┐
│                  WITHDRAWAL FLOW                         │
└─────────────────────────────────────────────────────────┘

1. User click "Withdraw" (Rút tiền)
   ↓
2. Chọn bank card (hoặc thêm mới)
   ↓
3. Nhập số tiền + password xác nhận
   ↓
4. POST /api/vip/withdrawal
   {
     amount: 500,
     bankCardId: "card-id",
     password: "user-password"
   }
   ↓
5. Backend validate:
   ✓ Password đúng
   ✓ Balance đủ
   ✓ Bank card tồn tại
   ↓
6. Create WithdrawalRequest:
   - status: "pending"
   ↓
7. Admin approve/reject
   ↓
8. If approved:
   ┌─────────────────────────────────────┐
   │ TRANSACTION (ACID)                  │
   ├─────────────────────────────────────┤
   │ 1. Update WithdrawalRequest:        │
   │    - status = "approved"            │
   │                                     │
   │ 2. Update User:                     │
   │    - balance -= amount              │
   └─────────────────────────────────────┘
   ↓
9. User nhận tiền vào bank account
```

---

### 5. 💬 Chat Support Flow

```
┌─────────────────────────────────────────────────────────┐
│                    CHAT FLOW                             │
└─────────────────────────────────────────────────────────┘

USER SIDE:
1. User click "Help" tab
   ↓
2. Frontend connect Socket.IO:
   - Send JWT token
   - Join room: "user:{userId}"
   ↓
3. POST /api/chat/thread
   - Backend tạo ChatThread (nếu chưa có)
   - Return threadId
   ↓
4. Frontend join thread room:
   socket.emit('chat:joinThread', threadId)
   ↓
5. User gửi message:
   socket.emit('chat:send', { threadId, text })
   ↓
6. Backend:
   - Save message to database
   - Update thread.lastMessageAt
   - Increment thread.unreadForAdmin
   ↓
7. Broadcast to admin:
   io.to('admins').emit('chat:threadUpdated', {...})
   ↓
8. Admin nhận notification + reply
   ↓
9. User nhận message real-time:
   socket.on('chat:message', (msg) => {
     // Display message
     // Play sound (if enabled)
   })

ADMIN SIDE:
1. Admin login → Connect Socket.IO
   ↓
2. Join "admins" room
   ↓
3. GET /api/chat/admin/threads
   - List all chat threads
   - Show unread count
   ↓
4. Admin click thread → View messages
   ↓
5. Admin reply:
   POST /api/chat/admin/threads/:id/messages
   ↓
6. Broadcast to user:
   io.to(`user:${userId}`).emit('chat:message', {...})
```

**Real-time Features:**
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Sound notifications
- ✅ Unread counters
- ✅ Message cleanup (7 days)

---

### 6. 🎛️ Admin Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                   ADMIN FLOW                             │
└─────────────────────────────────────────────────────────┘

DASHBOARD:
1. Admin login → Dashboard
   ↓
2. GET /api/admin/dashboard/stats
   - Total users
   - Active users
   - Pending deposits
   - Today's revenue
   ↓
3. Display charts:
   - Weekly revenue
   - User growth
   - Recent users

USER MANAGEMENT:
1. Admin → Users tab
   ↓
2. GET /api/admin/users?page=1&limit=20
   ↓
3. Admin có thể:
   - View user details
   - Update VIP level
   - Toggle active/inactive
   - Top up balance
   - Delete user

DEPOSIT MANAGEMENT:
1. Admin → Deposits tab
   ↓
2. GET /api/admin/deposit-requests?status=pending
   ↓
3. Admin review request
   ↓
4. Click "Approve" hoặc "Reject"
   ↓
5. PATCH /api/admin/deposit-requests/:id/approve
   ↓
6. Backend auto update:
   - User balance
   - User VIP level
   - Deposit status

ORDER MANAGEMENT:
1. Admin → Orders tab
   ↓
2. GET /api/admin/orders
   ↓
3. Admin update order status:
   pending → processing → shipped → delivered
   ↓
4. PATCH /api/admin/orders/:id/status
```

---

## 🔄 Complete User Journey

```
DAY 1: REGISTRATION & FIRST DEPOSIT
┌────────────────────────────────────────┐
│ 1. Register với invite code            │
│ 2. Login → VIP 0 (balance: $0)         │
│ 3. Request deposit $100                 │
│ 4. Admin approve                        │
│ 5. Balance: $100, VIP 1 ✨              │
└────────────────────────────────────────┘

DAY 2: TAKING ORDERS
┌────────────────────────────────────────┐
│ 1. Take order #1 → Commission: $8      │
│ 2. Take order #2 → Commission: $8      │
│ 3. Take order #3 → Commission: $9      │
│ ...                                    │
│ 10. Daily target reached: $80          │
│ 11. Balance: $164 ($100 + $64)         │
└────────────────────────────────────────┘

DAY 3: CONTINUE EARNING
┌────────────────────────────────────────┐
│ 1. Daily reset → Can earn $80 more     │
│ 2. Take more orders                    │
│ 3. Earn commission                     │
└────────────────────────────────────────┘

WEEK 2: VIP UPGRADE
┌────────────────────────────────────────┐
│ 1. Deposit more → Total: $500          │
│ 2. Auto upgrade to VIP 2 ✨             │
│ 3. Commission: $12/order               │
│ 4. Daily target: $120                  │
└────────────────────────────────────────┘

MONTH 1: WITHDRAWAL
┌────────────────────────────────────────┐
│ 1. Balance: $1,500                     │
│ 2. Add bank card                       │
│ 3. Request withdrawal $500             │
│ 4. Admin approve                       │
│ 5. Receive money 💰                     │
└────────────────────────────────────────┘
```

---

## 🔐 Security Flow

### Authentication
```
1. User login → JWT token (7 days)
2. Token stored in localStorage
3. Every API request:
   Authorization: Bearer <token>
4. Backend verify token:
   - Check signature
   - Check expiration
   - Extract userId
5. If valid → Process request
   If invalid → Return 401
```

### Password Security
```
1. User register/change password
   ↓
2. Backend hash password:
   bcrypt.hash(password, 10 rounds)
   ↓
3. Store hashed password in DB
   ↓
4. Login: Compare hashed passwords
   bcrypt.compare(input, stored)
```

### Idempotency (Prevent Duplicates)
```
1. Frontend generate unique key:
   idempotencyKey = `${userId}-${timestamp}-${random}`
   ↓
2. Send with order request
   ↓
3. Backend check:
   - Same userId + clientRequestId exists?
   - Same product within 5 minutes?
   ↓
4. If duplicate → Return existing order
   If new → Create new order
```

---

## 📊 Data Flow Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Express   │ ◄─────► │    MySQL    │
│  (React)    │  HTTP   │   Server    │  Prisma │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │
       │                       │
       │    Socket.IO          │
       └───────────────────────┘
              (Real-time)
```

### Request Flow
```
1. User action (click button)
   ↓
2. Frontend call API service
   api.takeOrder(product)
   ↓
3. Axios send HTTP request
   POST /api/orders/take
   Headers: { Authorization: Bearer <token> }
   Body: { product: {...} }
   ↓
4. Express middleware:
   - CORS check
   - JWT verify
   - Body parse
   ↓
5. Route handler:
   routes/orders.js
   ↓
6. Business logic:
   - Validate input
   - Calculate commission
   - Check limits
   ↓
7. Database operation:
   prisma.$transaction([
     prisma.order.create(...),
     prisma.user.update(...)
   ])
   ↓
8. Return response:
   { success: true, data: {...} }
   ↓
9. Frontend update UI
```

---

## 🎯 Key Features Flow

### 1. VIP System
```
Deposit → totalDeposited increases → Check thresholds → Auto upgrade
```

### 2. Commission System
```
Take order → Calculate based on VIP → Apply randomness → Check daily cap → Credit user
```

### 3. Daily Reset
```
00:00 → Reset dailyEarnings → User can earn again
```

### 4. Real-time Chat
```
Socket.IO → Rooms → Broadcast → Real-time updates
```

### 5. Transaction Safety
```
Prisma.$transaction → ACID → Rollback on error
```

---

## 📝 Summary

**Main Flows:**
1. ✅ Register → Login → Get token
2. ✅ Deposit → Admin approve → VIP upgrade
3. ✅ Take orders → Earn commission → Daily limit
4. ✅ Withdraw → Admin approve → Receive money
5. ✅ Chat → Real-time support
6. ✅ Admin → Manage everything

**Key Points:**
- 🔐 JWT authentication
- 💰 Commission based on VIP level
- 📊 Daily earning limits
- 🔄 Auto VIP upgrade
- 💬 Real-time chat
- 🛡️ ACID transactions
- ⚡ Fast MySQL queries

---

**Dự án hoạt động như một hệ sinh thái hoàn chỉnh với user earning, VIP progression, và admin management!** 🎉
