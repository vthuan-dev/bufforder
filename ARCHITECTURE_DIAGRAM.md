# 🏗️ Architecture Diagram - Greeting Message Platform

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐              ┌──────────────────┐            │
│  │   User App       │              │   Admin Panel    │            │
│  │  (React + TS)    │              │  (React + TS)    │            │
│  │                  │              │                  │            │
│  │  - Home          │              │  - Dashboard     │            │
│  │  - Orders        │              │  - Users         │            │
│  │  - Record        │              │  - Orders        │            │
│  │  - Help (Chat)   │              │  - Deposits      │            │
│  │  - My Profile    │              │  - Withdrawals   │            │
│  └────────┬─────────┘              └────────┬─────────┘            │
│           │                                 │                       │
│           │         Socket.IO (Real-time)   │                       │
│           └─────────────┬───────────────────┘                       │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │ HTTP/WebSocket
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                         │        SERVER LAYER                        │
├─────────────────────────┼───────────────────────────────────────────┤
│                         ▼                                           │
│              ┌──────────────────────┐                               │
│              │   Express Server     │                               │
│              │   (Node.js)          │                               │
│              │                      │                               │
│              │  - CORS              │                               │
│              │  - JWT Auth          │                               │
│              │  - Compression       │                               │
│              │  - Socket.IO         │                               │
│              └──────────┬───────────┘                               │
│                         │                                           │
│         ┌───────────────┼───────────────┐                           │
│         │               │               │                           │
│         ▼               ▼               ▼                           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │  Routes  │    │Middleware│    │ Services │                      │
│  │          │    │          │    │          │                      │
│  │ - auth   │    │ - auth   │    │ - message│                      │
│  │ - orders │    │ - cors   │    │   cleanup│                      │
│  │ - vip    │    │ - error  │    │          │                      │
│  │ - admin  │    │          │    │          │                      │
│  │ - chat   │    │          │    │          │                      │
│  └────┬─────┘    └──────────┘    └──────────┘                      │
│       │                                                             │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────┐                                          │
│  │   Prisma ORM         │                                          │
│  │                      │                                          │
│  │  - Type-safe queries │                                          │
│  │  - Migrations        │                                          │
│  │  - Connection pool   │                                          │
│  └──────────┬───────────┘                                          │
│             │                                                       │
└─────────────┼───────────────────────────────────────────────────────┘
              │
              │ SQL Queries
              │
┌─────────────┼───────────────────────────────────────────────────────┐
│             │          DATABASE LAYER                               │
├─────────────┼───────────────────────────────────────────────────────┤
│             ▼                                                       │
│    ┌─────────────────┐                                             │
│    │  MySQL (XAMPP)  │                                             │
│    │  MariaDB 10.4   │                                             │
│    │                 │                                             │
│    │  Tables:        │                                             │
│    │  - User         │                                             │
│    │  - Order        │                                             │
│    │  - Admin        │                                             │
│    │  - ChatThread   │                                             │
│    │  - ChatMessage  │                                             │
│    │  - Deposit      │                                             │
│    │  - Withdrawal   │                                             │
│    │  - Address      │                                             │
│    │  - BankCard     │                                             │
│    └─────────────────┘                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

### HTTP Request Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ 1. User action (click button)
     │
     ▼
┌─────────────────┐
│  React Component│
└────┬────────────┘
     │
     │ 2. Call API service
     │    api.takeOrder(product)
     │
     ▼
┌─────────────────┐
│  API Service    │
│  (axios)        │
└────┬────────────┘
     │
     │ 3. HTTP Request
     │    POST /api/orders/take
     │    Headers: { Authorization: Bearer <token> }
     │    Body: { product: {...} }
     │
     ▼
┌─────────────────┐
│  Express Server │
└────┬────────────┘
     │
     │ 4. Middleware Chain
     │
     ├─► CORS Check ✓
     │
     ├─► JWT Verify ✓
     │
     ├─► Body Parse ✓
     │
     ▼
┌─────────────────┐
│  Route Handler  │
│  (orders.js)    │
└────┬────────────┘
     │
     │ 5. Business Logic
     │
     ├─► Validate input
     │
     ├─► Check balance
     │
     ├─► Calculate commission
     │
     ├─► Check daily limit
     │
     ▼
┌─────────────────┐
│  Prisma Client  │
└────┬────────────┘
     │
     │ 6. Database Transaction
     │
     ├─► BEGIN TRANSACTION
     │
     ├─► INSERT INTO Order
     │
     ├─► UPDATE User SET balance
     │
     ├─► COMMIT
     │
     ▼
┌─────────────────┐
│  MySQL Database │
└────┬────────────┘
     │
     │ 7. Return Result
     │
     ▼
┌─────────────────┐
│  Express Server │
│  Response       │
└────┬────────────┘
     │
     │ 8. JSON Response
     │    { success: true, data: {...} }
     │
     ▼
┌─────────────────┐
│  React Component│
│  Update UI      │
└─────────────────┘
```

---

## 💬 Real-time Chat Flow

```
USER SIDE                          SERVER                      ADMIN SIDE

┌─────────┐                   ┌──────────────┐              ┌─────────┐
│ Browser │                   │ Socket.IO    │              │ Browser │
└────┬────┘                   │   Server     │              └────┬────┘
     │                        └──────┬───────┘                   │
     │ 1. Connect Socket.IO          │                           │
     ├──────────────────────────────►│                           │
     │    auth: { token }            │                           │
     │                               │                           │
     │ 2. Join user room             │                           │
     │    socket.join('user:123')    │                           │
     │◄──────────────────────────────┤                           │
     │                               │                           │
     │                               │ 3. Admin connects         │
     │                               │◄──────────────────────────┤
     │                               │    auth: { adminToken }   │
     │                               │                           │
     │                               │ 4. Join admins room       │
     │                               │    socket.join('admins')  │
     │                               ├──────────────────────────►│
     │                               │                           │
     │ 5. User sends message         │                           │
     ├──────────────────────────────►│                           │
     │    emit('chat:send', {...})   │                           │
     │                               │                           │
     │                               │ 6. Save to DB             │
     │                               │    prisma.chatMessage     │
     │                               │                           │
     │                               │ 7. Broadcast to admin     │
     │                               ├──────────────────────────►│
     │                               │    emit('chat:message')   │
     │                               │                           │
     │                               │ 8. Admin replies          │
     │                               │◄──────────────────────────┤
     │                               │    emit('chat:send')      │
     │                               │                           │
     │ 9. Receive message            │                           │
     │◄──────────────────────────────┤                           │
     │    on('chat:message')         │                           │
     │                               │                           │
     │ 10. Play sound 🔔             │                           │
     │                               │                           │
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                          │
└──────────────────────────────────────────────────────────────┘

User Input                Backend Processing              Database
─────────                 ──────────────────              ────────

Phone: 0123456789    ──►  1. Check if exists        ──►  SELECT * FROM User
Password: abc123          2. Validate invite code        WHERE phoneNumber = ?
Invite: ASHFORD2024       3. Hash password
                              bcrypt.hash(pwd, 10)
                          4. Create user            ──►  INSERT INTO User
                          5. Generate JWT token          VALUES (...)
                              jwt.sign({userId}, secret)
                          6. Return token + user    ◄──  User created
                              
                     ◄──  { token, user }


┌──────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                               │
└──────────────────────────────────────────────────────────────┘

User Input                Backend Processing              Database
─────────                 ──────────────────              ────────

Phone: 0123456789    ──►  1. Find user              ──►  SELECT * FROM User
Password: abc123          2. Compare password            WHERE phoneNumber = ?
                              bcrypt.compare(input, hash)
                          3. Generate JWT token     ◄──  User found
                              jwt.sign({userId}, secret)
                          4. Return token + user
                              
                     ◄──  { token, user }


┌──────────────────────────────────────────────────────────────┐
│                   PROTECTED REQUEST FLOW                      │
└──────────────────────────────────────────────────────────────┘

Request                   Middleware                      Database
───────                   ──────────                      ────────

GET /api/orders/stats ──► 1. Extract token
Authorization:                from header
Bearer eyJhbGc...         2. Verify token
                              jwt.verify(token, secret)
                          3. Extract userId
                          4. Attach to req.userId
                          5. Call next()
                              
                          Route Handler:
                          6. Use req.userId         ──►  SELECT * FROM Order
                          7. Query database              WHERE userId = ?
                          8. Return data            ◄──  Orders found
                              
                     ◄──  { success: true, data }
```

---

## 💰 Commission Calculation Flow

```
┌──────────────────────────────────────────────────────────────┐
│              COMMISSION CALCULATION FLOW                      │
└──────────────────────────────────────────────────────────────┘

Input                     Processing                      Output
─────                     ──────────                      ──────

User VIP Level: VIP 3 ──► 1. Get base commission    ──► $18/order
Product Price: $999           from VIP config
                          
                          2. Add randomness (±10%)
                             random = 0.9 to 1.1
                             commission = $18 × 1.05
                                        = $18.90
                          
                          3. Check daily earnings
Daily Earnings: $150         dailyTarget = $180 (VIP 3)
Daily Target: $180           remaining = $180 - $150
                                       = $30
                          
                          4. Apply cap
                             if commission > remaining:
                                commission = remaining
                             
                             $18.90 < $30 ✓
                             commission = $18.90
                          
                          5. Credit user (80%)
                             balance += $18.90 × 0.8
                                      = $15.12
                          
                          6. Track full commission
                             commission += $18.90
                             dailyEarnings += $18.90
                          
                     ──►  Balance: +$15.12
                          Commission: +$18.90
                          Daily: $168.90 / $180
```

---

## 🔄 VIP Upgrade Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    VIP UPGRADE FLOW                           │
└──────────────────────────────────────────────────────────────┘

Deposit                   Processing                      Result
───────                   ──────────                      ──────

Current State:
- VIP Level: VIP 1
- Total Deposited: $400
- Balance: $500

User deposits $200   ──►  1. Update totals
                             totalDeposited = $400 + $200
                                            = $600
                             balance = $500 + $200
                                     = $700
                          
                          2. Check VIP thresholds
                             $600 >= $500 (VIP 2) ✓
                             $600 >= $1000 (VIP 3) ✗
                          
                          3. Upgrade to VIP 2
                             vipLevel = "vip-2"
                          
                          4. Update commission config
                             commissionPerOrder = $12
                             dailyTarget = $120
                          
                     ──►  New State:
                          - VIP Level: VIP 2 ✨
                          - Total Deposited: $600
                          - Balance: $700
                          - Commission: $12/order
                          - Daily Target: $120
```

---

## 📊 Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│     User     │
├──────────────┤
│ id (PK)      │───┐
│ phoneNumber  │   │
│ fullName     │   │
│ password     │   │
│ vipLevel     │   │
│ balance      │   │
│ commission   │   │
└──────────────┘   │
                   │
                   │ 1:N
                   │
        ┌──────────┼──────────┬──────────┬──────────┐
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Order   │ │ Deposit  │ │Withdrawal│ │ Address  │ │ BankCard │
├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│ id (PK)  │ │ id (PK)  │ │ id (PK)  │ │ id (PK)  │ │ id (PK)  │
│ userId   │ │ userId   │ │ userId   │ │ userId   │ │ userId   │
│ product  │ │ amount   │ │ amount   │ │ address  │ │ bankName │
│ commission│ │ status   │ │ status   │ │ isDefault│ │ cardNum  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────────┐
│ ChatThread   │
├──────────────┤
│ id (PK)      │───┐
│ userId (FK)  │   │
│ unreadCount  │   │
│ status       │   │
└──────────────┘   │
                   │ 1:N
                   │
                   ▼
            ┌──────────────┐
            │ ChatMessage  │
            ├──────────────┤
            │ id (PK)      │
            │ threadId (FK)│
            │ senderType   │
            │ text         │
            │ imageUrl     │
            └──────────────┘

┌──────────────┐
│    Admin     │
├──────────────┤
│ id (PK)      │
│ username     │
│ password     │
│ role         │
└──────────────┘
```

---

## 🎯 Summary

**Architecture Highlights:**
- ✅ **3-tier architecture**: Client → Server → Database
- ✅ **RESTful API**: HTTP endpoints cho CRUD operations
- ✅ **Real-time**: Socket.IO cho chat và notifications
- ✅ **Type-safe**: Prisma ORM với TypeScript
- ✅ **Secure**: JWT authentication + bcrypt passwords
- ✅ **Scalable**: Connection pooling + efficient queries
- ✅ **Reliable**: ACID transactions + error handling

**Key Components:**
1. 🎨 **Frontend**: React + TypeScript + Vite
2. 🔧 **Backend**: Node.js + Express + Socket.IO
3. 🗄️ **Database**: MySQL + Prisma ORM
4. 🔐 **Auth**: JWT tokens + bcrypt
5. 💬 **Real-time**: Socket.IO rooms
6. 📊 **Data**: Prisma Client với type safety

---

**Kiến trúc được thiết kế để dễ maintain, scale, và extend!** 🚀
