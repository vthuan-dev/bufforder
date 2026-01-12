# Database Entity Relationship Diagram (ERD)

## 📊 Tổng quan Database
- **Database**: MySQL (MariaDB 10.4.32)
- **ORM**: Prisma 5.22.0
- **Tổng số bảng**: 9 tables
- **Tổng số quan hệ**: 8 relationships

---

## 🗂️ Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER (Bảng chính)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id                 String (CUID)                                         │
│ UQ  phoneNumber        String                                                │
│ UQ  email              String?                                               │
│     fullName           String                                                │
│     password           String (hashed)                                       │
│     vipLevel           String (default: "vip-0")                             │
│     totalDeposited     Float (default: 0)                                    │
│     balance            Float (default: 0)                                    │
│     freezeBalance      Float (default: 0)                                    │
│     commission         Float (default: 0)                                    │
│     isActive           Boolean (default: true)                               │
│     lastSeenAt         DateTime?                                             │
│     inviteCodeUsed     String?                                               │
│     commissionConfig   Json? (commission settings)                           │
│     dailyEarnings      Json? (daily stats)                                   │
│     createdAt          DateTime                                              │
│     updatedAt          DateTime                                              │
│                                                                               │
│ Indexes:                                                                      │
│   - phoneNumber                                                               │
│   - fullName                                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    │ 1:N relationships
        ┌───────────┼───────────┬───────────┬───────────┬───────────┐
        │           │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼           ▼
┌───────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────────┐
│  ADDRESS  │ │ BANKCARD │ │ ORDER  │ │CHATTHREAD│ │DEPOSITREQUEST│ │WITHDRAWALREQUEST │
└───────────┘ └──────────┘ └────────┘ └──────────┘ └──────────────┘ └──────────────────┘
                                            │
                                            │ 1:N
                                            ▼
                                    ┌──────────────┐
                                    │ CHATMESSAGE  │
                                    └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                   ADMIN                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id              String (CUID)                                            │
│ UQ  username        String                                                   │
│ UQ  email           String                                                   │
│     fullName        String?                                                  │
│     phoneNumber     String?                                                  │
│     password        String (hashed)                                          │
│     role            String (default: "admin")                                │
│     isActive        Boolean (default: true)                                  │
│     lastLogin       DateTime?                                                │
│     createdAt       DateTime                                                 │
│     updatedAt       DateTime                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Chi tiết các bảng và quan hệ

### 1️⃣ **ADDRESS** (Địa chỉ giao hàng)
```
┌─────────────────────────────────────────┐
│            ADDRESS                      │
├─────────────────────────────────────────┤
│ PK  id            String (CUID)         │
│ FK  userId        String → User.id      │
│     fullName      String                │
│     phoneNumber   String                │
│     addressLine1  String                │
│     city          String                │
│     postalCode    String                │
│     isDefault     Boolean (default: false)│
│                                         │
│ Indexes: userId                         │
│ Cascade: ON DELETE CASCADE              │
└─────────────────────────────────────────┘
```
**Quan hệ**: N:1 với User (Một user có nhiều địa chỉ)

---

### 2️⃣ **BANKCARD** (Thẻ ngân hàng)
```
┌─────────────────────────────────────────┐
│            BANKCARD                     │
├─────────────────────────────────────────┤
│ PK  id            String (CUID)         │
│ FK  userId        String → User.id      │
│     bankName      String                │
│     cardNumber    String                │
│     accountName   String                │
│     isDefault     Boolean (default: false)│
│                                         │
│ Indexes: userId                         │
│ Cascade: ON DELETE CASCADE              │
└─────────────────────────────────────────┘
```
**Quan hệ**: N:1 với User (Một user có nhiều thẻ ngân hàng)

---

### 3️⃣ **ORDER** (Đơn hàng)
```
┌─────────────────────────────────────────────────┐
│                  ORDER                          │
├─────────────────────────────────────────────────┤
│ PK  id                String (CUID)             │
│ FK  userId            String → User.id          │
│ UQ  orderNumber       String                    │
│     clientRequestId   String?                   │
│     productId         Int                       │
│     productName       String                    │
│     productPrice      Float                     │
│     commissionRate    Float                     │
│     commissionAmount  Float                     │
│     brand             String?                   │
│     category          String?                   │
│     image             Text                      │
│     status            String (default: "pending")│
│     completedAt       DateTime?                 │
│     orderDate         DateTime                  │
│     createdAt         DateTime                  │
│     updatedAt         DateTime                  │
│                                                 │
│ Unique: (userId, clientRequestId)               │
│ Indexes:                                        │
│   - (userId, orderDate DESC)                    │
│   - status                                      │
└─────────────────────────────────────────────────┘
```
**Quan hệ**: N:1 với User (Một user có nhiều đơn hàng)
**Idempotency**: Dùng `clientRequestId` để tránh duplicate orders

---

### 4️⃣ **CHATTHREAD** (Phòng chat)
```
┌─────────────────────────────────────────────────┐
│               CHATTHREAD                        │
├─────────────────────────────────────────────────┤
│ PK  id                String (CUID)             │
│ FK  userId            String → User.id          │
│     userIp            String?                   │
│     lastMessageAt     DateTime                  │
│     lastMessageText   Text?                     │
│     unreadForAdmin    Int (default: 0)          │
│     unreadForUser     Int (default: 0)          │
│     status            String (default: "open")  │
│     createdAt         DateTime                  │
│     updatedAt         DateTime                  │
│                                                 │
│ Indexes:                                        │
│   - (userId, lastMessageAt DESC)                │
│   - lastMessageAt                               │
└─────────────────────────────────────────────────┘
```
**Quan hệ**: 
- N:1 với User (Một user có nhiều chat threads)
- 1:N với ChatMessage (Một thread có nhiều messages)

---

### 5️⃣ **CHATMESSAGE** (Tin nhắn chat)
```
┌─────────────────────────────────────────────────┐
│              CHATMESSAGE                        │
├─────────────────────────────────────────────────┤
│ PK  id                  String (CUID)           │
│ FK  threadId            String → ChatThread.id  │
│     senderType          String (user/admin)     │
│     senderId            String                  │
│     text                Text?                   │
│     imageUrl            Text?                   │
│     readByAdmin         Boolean (default: false)│
│     readByUser          Boolean (default: false)│
│     isDeletedForUser    Boolean (default: false)│
│     deletedForUserAt    DateTime?               │
│     isDeletedForAdmin   Boolean (default: false)│
│     deletedForAdminAt   DateTime?               │
│     createdAt           DateTime                │
│     updatedAt           DateTime                │
│                                                 │
│ Indexes: threadId                               │
│ Cascade: ON DELETE CASCADE                      │
└─────────────────────────────────────────────────┘
```
**Quan hệ**: N:1 với ChatThread (Một thread có nhiều messages)

---

### 6️⃣ **DEPOSITREQUEST** (Yêu cầu nạp tiền)
```
┌─────────────────────────────────────────────────┐
│            DEPOSITREQUEST                       │
├─────────────────────────────────────────────────┤
│ PK  id                String (CUID)             │
│ FK  userId            String → User.id          │
│     amount            Float                     │
│     status            String (default: "pending")│
│     requestDate       DateTime                  │
│     approvedBy        String?                   │
│     approvedAt        DateTime?                 │
│     rejectionReason   Text?                     │
│     notes             Text?                     │
│     createdAt         DateTime                  │
│     updatedAt         DateTime                  │
│                                                 │
│ Indexes:                                        │
│   - (userId, status)                            │
│   - (status, requestDate DESC)                  │
└─────────────────────────────────────────────────┘
```
**Quan hệ**: N:1 với User (Một user có nhiều yêu cầu nạp tiền)

---

### 7️⃣ **WITHDRAWALREQUEST** (Yêu cầu rút tiền)
```
┌─────────────────────────────────────────────────┐
│          WITHDRAWALREQUEST                      │
├─────────────────────────────────────────────────┤
│ PK  id                String (CUID)             │
│ FK  userId            String → User.id          │
│     amount            Float                     │
│     bankCardId        String                    │
│     status            String (default: "pending")│
│     approvedBy        String?                   │
│     approvedAt        DateTime?                 │
│     rejectionReason   Text?                     │
│     notes             Text?                     │
│     requestDate       DateTime                  │
│     createdAt         DateTime                  │
│     updatedAt         DateTime                  │
│                                                 │
│ Indexes:                                        │
│   - (userId, status)                            │
│   - (status, requestDate DESC)                  │
└─────────────────────────────────────────────────┘
```
**Quan hệ**: N:1 với User (Một user có nhiều yêu cầu rút tiền)

---

### 8️⃣ **ADMIN** (Quản trị viên)
```
┌─────────────────────────────────────────────────┐
│                  ADMIN                          │
├─────────────────────────────────────────────────┤
│ PK  id            String (CUID)                 │
│ UQ  username      String                        │
│ UQ  email         String                        │
│     fullName      String?                       │
│     phoneNumber   String?                       │
│     password      String (hashed)               │
│     role          String (default: "admin")     │
│     isActive      Boolean (default: true)       │
│     lastLogin     DateTime?                     │
│     createdAt     DateTime                      │
│     updatedAt     DateTime                      │
└─────────────────────────────────────────────────┘
```
**Quan hệ**: Độc lập (không có foreign key)

---

## 🔗 Tổng hợp quan hệ (Relationships)

| Parent Table | Child Table | Relationship | Cascade Delete |
|-------------|-------------|--------------|----------------|
| User | Address | 1:N | ✅ YES |
| User | BankCard | 1:N | ✅ YES |
| User | Order | 1:N | ❌ NO |
| User | ChatThread | 1:N | ❌ NO |
| User | DepositRequest | 1:N | ❌ NO |
| User | WithdrawalRequest | 1:N | ❌ NO |
| ChatThread | ChatMessage | 1:N | ✅ YES |
| Admin | (none) | - | - |

---

## 📊 Indexes và Performance

### Primary Indexes (Auto-created)
- Tất cả bảng có `id` (CUID) làm Primary Key

### Unique Indexes
- `User.phoneNumber` - Đăng nhập bằng SĐT
- `User.email` - Email unique
- `Order.orderNumber` - Mã đơn hàng unique
- `Order.(userId, clientRequestId)` - Idempotency key
- `Admin.username` - Username unique
- `Admin.email` - Email unique

### Performance Indexes
- `User.phoneNumber` - Fast login lookup
- `User.fullName` - Search users by name
- `Order.(userId, orderDate DESC)` - User order history
- `Order.status` - Filter by order status
- `ChatThread.(userId, lastMessageAt DESC)` - User chat threads
- `ChatThread.lastMessageAt` - Recent chats
- `ChatMessage.threadId` - Messages in thread
- `DepositRequest.(userId, status)` - User deposits
- `DepositRequest.(status, requestDate DESC)` - Admin review queue
- `WithdrawalRequest.(userId, status)` - User withdrawals
- `WithdrawalRequest.(status, requestDate DESC)` - Admin review queue

---

## 🔐 Security Features

### Password Security
- Bcrypt hashing (10 rounds)
- Stored in `User.password` và `Admin.password`

### JWT Authentication
- User tokens: `{ userId: string }`
- Admin tokens: `{ adminId: string }`
- Secret key: `JWT_SECRET` trong `.env`

### Foreign Key Constraints
- Đảm bảo data integrity
- Cascade delete cho Address, BankCard, ChatMessage
- Prevent orphaned records

---

## 💾 Data Types

### String Types
- `String` - VARCHAR(191) default
- `@db.Text` - TEXT type cho long content (images, messages)

### Numeric Types
- `Int` - Integer
- `Float` - Decimal numbers (money, commission)

### Date Types
- `DateTime` - Timestamp with timezone
- `@default(now())` - Auto-set on create
- `@updatedAt` - Auto-update on modify

### JSON Types
- `Json` - Flexible data storage
- Used for: `commissionConfig`, `dailyEarnings`

---

## 📈 Database Statistics

### Estimated Row Counts (Production)
- Users: 1,000 - 10,000
- Orders: 10,000 - 100,000
- ChatThreads: 500 - 5,000
- ChatMessages: 5,000 - 50,000
- DepositRequests: 1,000 - 10,000
- WithdrawalRequests: 500 - 5,000
- Addresses: 1,000 - 10,000
- BankCards: 1,000 - 10,000
- Admins: 5 - 20

### Storage Estimates
- Total database size: ~500MB - 2GB (with indexes)
- Largest tables: Order, ChatMessage
- Image storage: Separate `/uploads` folder

---

## 🎯 Key Design Decisions

### 1. CUID vs Auto-increment
- ✅ Using CUID for better security and distributed systems
- ❌ Not using auto-increment integers (predictable IDs)

### 2. Soft Delete vs Hard Delete
- ChatMessage: Soft delete with `isDeletedForUser`, `isDeletedForAdmin`
- Other tables: Hard delete with cascade where appropriate

### 3. JSON Fields
- `commissionConfig`: Flexible commission rules per user
- `dailyEarnings`: Daily stats without separate table

### 4. Idempotency
- `Order.(userId, clientRequestId)` unique constraint
- Prevents duplicate order creation

### 5. Real-time Features
- Socket.IO for chat
- `lastSeenAt` for user presence
- `unreadForAdmin`, `unreadForUser` counters

---

## 🚀 Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name init

# Apply migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Reset database (DEV ONLY)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

---

## 📝 Notes

- Database: `greeting_message`
- Charset: `utf8mb4` (supports emoji)
- Collation: `utf8mb4_unicode_ci`
- Engine: InnoDB (supports transactions)
- Connection pooling: Enabled via Prisma
