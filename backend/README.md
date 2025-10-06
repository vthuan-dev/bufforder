# Greeting Message Backend

Backend API cho ứng dụng Greeting Message với MongoDB.

## Cài đặt

1. Cài đặt dependencies:
```bash
cd backend
npm install
```

2. Chạy server:
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

### Health Check

- `GET /api/health` - Kiểm tra trạng thái server

## MongoDB Connection

Kết nối với MongoDB Atlas:
- Database: Cluster0
- User: vanthuann018_db_user
- Connection String: Đã được cấu hình trong config.js

## Cấu trúc Database

### User Collection
```javascript
{
  _id: ObjectId,
  phoneNumber: String (unique),
  fullName: String,
  email: String (unique),
  password: String (hashed),
  vipLevel: String (default: 'VIP 1'),
  balance: Number (default: 0),
  freezeBalance: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Password hashing với bcrypt
- JWT token authentication
- CORS configuration
- Input validation
- Error handling

## Development

Server chạy trên port 5000, frontend trên port 3000.
CORS đã được cấu hình để cho phép frontend kết nối.
