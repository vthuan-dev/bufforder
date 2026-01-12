# Greeting Message Backend

Backend API cho ứng dụng Greeting Message với MySQL (Prisma ORM).

## Cài đặt

1. Cài đặt dependencies:
```bash
cd backend
npm install
```

2. Cấu hình database:
```bash
# Copy .env.example thành .env
cp .env.example .env

# Cập nhật DATABASE_URL trong .env
DATABASE_URL="mysql://user:password@localhost:3306/greeting_message"
```

3. Chạy Prisma migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Tạo admin account:
```bash
node create-admin.js
# Hoặc với custom credentials:
node create-admin.js admin admin123 admin@example.com "Admin Name"
```

5. Chạy server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin user (cần token)
- `PUT /api/auth/profile` - Cập nhật thông tin user (cần token)
- `POST /api/auth/change-password` - Đổi mật khẩu

### VIP & Wallet

- `GET /api/vip/levels` - Lấy danh sách VIP levels
- `GET /api/vip/status` - Lấy VIP status của user
- `POST /api/vip/deposit` - Tạo yêu cầu nạp tiền
- `POST /api/vip/withdrawal` - Tạo yêu cầu rút tiền
- `GET /api/vip/bank-cards` - Lấy danh sách thẻ ngân hàng
- `POST /api/vip/bank-cards` - Thêm thẻ ngân hàng

### Orders

- `GET /api/orders/stats` - Lấy thống kê orders
- `POST /api/orders/take` - Nhận order mới
- `GET /api/orders/history` - Lịch sử orders

### Admin

- `POST /api/admin/login` - Admin đăng nhập
- `GET /api/admin/profile` - Thông tin admin
- `GET /api/admin/dashboard/stats` - Thống kê dashboard
- `GET /api/admin/users` - Quản lý users
- `GET /api/admin/orders` - Quản lý orders
- `GET /api/admin/deposit-requests` - Quản lý nạp tiền
- `GET /api/admin/withdrawal-requests` - Quản lý rút tiền

### Chat

- `POST /api/chat/thread` - Tạo/lấy chat thread
- `GET /api/chat/thread/:id/messages` - Lấy tin nhắn
- `POST /api/chat/thread/:id/messages` - Gửi tin nhắn
- `GET /api/chat/admin/threads` - Admin: danh sách threads

### Health Check

- `GET /api/health` - Kiểm tra trạng thái server

## Database (MySQL + Prisma)

### Cấu trúc Database

Xem file `prisma/schema.prisma` để biết chi tiết schema.

**Main Tables:**
- `User` - Thông tin users, balance, VIP level
- `Order` - Orders với commission tracking
- `Admin` - Admin accounts
- `ChatThread` - Chat conversations
- `ChatMessage` - Chat messages
- `DepositRequest` - Yêu cầu nạp tiền
- `WithdrawalRequest` - Yêu cầu rút tiền
- `Address` - Địa chỉ giao hàng
- `BankCard` - Thẻ ngân hàng

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

## Security Features

- Password hashing với bcrypt (10 rounds)
- JWT token authentication (7 days expiry)
- CORS configuration với whitelist
- Input validation
- SQL injection protection (Prisma)
- XSS protection
- Idempotency keys cho orders

## Real-time Features (Socket.IO)

- Chat support real-time
- Typing indicators
- Online/offline presence
- Sound notifications
- Message cleanup service (7 days retention)

## Development

- Server: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Prisma Studio: `http://localhost:5555`

CORS đã được cấu hình để cho phép frontend kết nối.

## Testing

```bash
# Test admin endpoints
node test-all-admin-endpoints.js

# Test dashboard APIs
node test-dashboard-apis.js

# Test orders integration
node test-orders-integration.js

# Test password change
node test-password-change.js

# Test message cleanup
node test-message-cleanup.js
```
