# 🚀 Quick Start Guide

Hướng dẫn nhanh để setup và chạy dự án Greeting Message Platform.

## 📋 Yêu Cầu

- **Node.js**: v16 trở lên
- **MySQL**: v8.0 trở lên
- **npm** hoặc **yarn**

## 🔧 Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd greeting-message
```

### 2. Install Dependencies

```bash
# Install root dependencies (Socket.IO)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Setup MySQL Database

```bash
# Đăng nhập MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE greeting_message;

# Tạo user (optional)
CREATE USER 'greeting_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON greeting_message.* TO 'greeting_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure Backend

```bash
cd backend

# Copy .env.example
cp .env.example .env

# Edit .env và cập nhật DATABASE_URL
# DATABASE_URL="mysql://root:password@localhost:3306/greeting_message"
```

### 5. Run Prisma Migrations

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio để xem database
npx prisma studio
```

### 6. Create Admin Account

```bash
cd backend

# Tạo admin với credentials mặc định
# Username: admin
# Password: admin123
node create-admin.js

# Hoặc tạo với custom credentials
node create-admin.js myusername mypassword admin@email.com "Admin Name"
```

### 7. Start Backend Server

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Backend sẽ chạy tại: `http://localhost:5000`

### 8. Start Frontend

```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 🎯 Quick Start (PowerShell Script)

Nếu bạn dùng Windows, có thể dùng script tự động:

```powershell
.\start-dev.ps1
```

Script này sẽ:
- Start backend server
- Start frontend dev server
- Mở browser tự động

## 🧪 Verify Setup

Chạy script kiểm tra:

```bash
node verify-mysql-only.js
```

Script này sẽ kiểm tra:
- ✅ Prisma packages installed
- ✅ No MongoDB references
- ✅ MySQL configured correctly
- ✅ All routes using Prisma

## 📱 Access Application

### User App
- URL: `http://localhost:3000`
- Đăng ký tài khoản mới với invite code: `ASHFORD2024`

### Admin Panel
- URL: `http://localhost:3000` → Click "Admin Login"
- Username: `admin`
- Password: `admin123`

## 🔑 Default Credentials

### Admin
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`

### Invite Codes
- `ASHFORD2024` (main code)
- `570318`, `942615`, `803247`, `169437`, `285074`
- `637890`, `451908`, `726349`, `394176`, `820564`

## 🛠️ Common Commands

### Backend

```bash
cd backend

# Start dev server
npm run dev

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Create admin
node create-admin.js

# Run tests
node test-all-admin-endpoints.js
```

### Frontend

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 Database Management

### Prisma Studio (GUI)

```bash
cd backend
npx prisma studio
```

Mở browser tại: `http://localhost:5555`

### MySQL CLI

```bash
# Connect to database
mysql -u root -p greeting_message

# Show tables
SHOW TABLES;

# View users
SELECT * FROM User LIMIT 10;

# View orders
SELECT * FROM Order LIMIT 10;
```

## 🐛 Troubleshooting

### Backend không start

```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Kiểm tra port 5000
netstat -ano | findstr :5000

# Regenerate Prisma Client
cd backend
npx prisma generate
```

### Frontend không load data

```bash
# Kiểm tra backend đang chạy
curl http://localhost:5000/api/health

# Kiểm tra CORS settings trong backend/server.js

# Clear browser cache và localStorage
```

### Database connection error

```bash
# Kiểm tra DATABASE_URL trong .env
cat backend/.env

# Test connection
cd backend
npx prisma db pull
```

### Migration errors

```bash
# Reset database (⚠️ xóa tất cả data)
cd backend
npx prisma migrate reset

# Hoặc push schema without migration
npx prisma db push
```

## 📚 Next Steps

1. **Đọc Documentation**
   - `backend/README.md` - Backend API docs
   - `MIGRATION_TO_MYSQL.md` - Database migration guide
   - `ADMIN_API_STRUCTURE.md` - Admin API structure

2. **Customize VIP Levels**
   - Edit `backend/config/vipLevels.js`

3. **Configure CORS**
   - Edit `backend/server.js` → `STATIC_ALLOWED`

4. **Setup Production**
   - Configure environment variables
   - Setup SSL certificates
   - Configure reverse proxy (nginx)

## 🎉 You're Ready!

Dự án đã sẵn sàng để phát triển!

- 👥 User app: Đăng ký, nạp tiền, nhận orders, kiếm hoa hồng
- 🎛️ Admin panel: Quản lý users, orders, deposits, withdrawals
- 💬 Chat support: Real-time chat giữa users và admin
- 📊 Dashboard: Thống kê và analytics

## 💡 Tips

- Dùng Prisma Studio để debug database
- Check console logs để debug issues
- Dùng browser DevTools → Network tab để xem API calls
- Enable sound notifications trong user settings

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs (backend terminal)
2. Check browser console (F12)
3. Check network requests (DevTools → Network)
4. Run `node verify-mysql-only.js` để verify setup

---

**Happy Coding! 🚀**
