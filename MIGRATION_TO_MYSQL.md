# 🔄 Migration từ MongoDB sang MySQL (Prisma)

## ✅ Đã Hoàn Thành

Dự án đã được migrate hoàn toàn từ MongoDB (Mongoose) sang MySQL với Prisma ORM.

## 📋 Những Thay Đổi

### 1. **Database**
- ❌ **Trước**: MongoDB + Mongoose
- ✅ **Sau**: MySQL + Prisma ORM

### 2. **Models**
- ❌ **Xóa**: Tất cả Mongoose models trong `backend/models/`
  - `Admin.js`
  - `User.js`
  - `Order.js`
  - `ChatThread.js`
  - `ChatMessage.js`
  - `DepositRequest.js`
  - `WithdrawalRequest.js`

- ✅ **Thay thế**: Prisma schema trong `backend/prisma/schema.prisma`

### 3. **Dependencies**
- ❌ **Xóa**: `mongoose` từ `package.json`
- ✅ **Giữ lại**: 
  - `@prisma/client`
  - `prisma`

### 4. **Configuration**
- ❌ **Xóa**: `MONGODB_URI` từ `config.js`
- ✅ **Giữ lại**: `DATABASE_URL` cho MySQL

### 5. **Scripts**
- ✅ **Cập nhật**: Tất cả test scripts để dùng Prisma
  - `test-all-admin-endpoints.js`
  - `test-dashboard-apis.js`
  - `test-orders-integration.js`
  
- ✅ **Cập nhật**: Admin creation scripts
  - `create-admin.js`
  - `create-admin-new.js`

### 6. **Routes**
- ✅ **Đã dùng Prisma**: Tất cả routes đã sử dụng Prisma
  - `routes/auth.js`
  - `routes/admin.js`
  - `routes/orders.js`
  - `routes/vip.js`
  - `routes/chat.js`

## 🚀 Setup Mới

### 1. Cài đặt Dependencies
```bash
cd backend
npm install
```

### 2. Cấu hình Database
```bash
# Copy .env.example
cp .env.example .env

# Cập nhật DATABASE_URL trong .env
DATABASE_URL="mysql://user:password@localhost:3306/greeting_message"
```

### 3. Chạy Prisma Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (nếu cần)
npx prisma db seed
```

### 4. Tạo Admin Account
```bash
# Tạo admin mặc định (admin/admin123)
node create-admin.js

# Hoặc tạo với custom credentials
node create-admin.js username password email@example.com "Full Name"
```

### 5. Khởi động Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📊 So Sánh

### MongoDB (Mongoose) vs MySQL (Prisma)

| Feature | MongoDB | MySQL (Prisma) |
|---------|---------|----------------|
| Schema | Flexible, schemaless | Strict, typed schema |
| Queries | Mongoose methods | Prisma Client API |
| Migrations | Manual | Automatic with Prisma Migrate |
| Type Safety | Limited | Full TypeScript support |
| Relations | Manual population | Automatic with `include` |
| Performance | Good for unstructured data | Better for relational data |
| Transactions | Limited | Full ACID support |

## 🎯 Lợi Ích

### 1. **Type Safety**
```typescript
// Prisma tự động generate types
const user = await prisma.user.findUnique({
  where: { id: userId }
});
// user có type đầy đủ, không cần manual typing
```

### 2. **Better Relations**
```typescript
// Include relations dễ dàng
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    user: true,  // Tự động join
  }
});
```

### 3. **Migrations**
```bash
# Prisma tự động tạo và track migrations
npx prisma migrate dev --name add_new_field
```

### 4. **Prisma Studio**
```bash
# GUI để xem và edit data
npx prisma studio
```

### 5. **Better Performance**
- Optimized queries
- Connection pooling
- Efficient joins
- Proper indexing

## 🔧 Prisma Commands

```bash
# Generate Prisma Client (sau khi thay đổi schema)
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from existing database
npx prisma db pull

# Push schema to database (without migration)
npx prisma db push
```

## 📝 Schema Example

```prisma
model User {
  id              String    @id @default(cuid())
  phoneNumber     String    @unique
  fullName        String
  email           String?   @unique
  password        String
  vipLevel        String    @default("vip-0")
  balance         Float     @default(0)
  
  // Relations
  orders          Order[]
  addresses       Address[]
  bankCards       BankCard[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([phoneNumber])
  @@index([fullName])
}
```

## 🐛 Troubleshooting

### 1. Connection Error
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Kiểm tra DATABASE_URL trong .env
echo $DATABASE_URL
```

### 2. Migration Error
```bash
# Reset database và chạy lại migrations
npx prisma migrate reset
npx prisma migrate dev
```

### 3. Prisma Client Error
```bash
# Regenerate Prisma Client
npx prisma generate
```

### 4. Schema Sync Issues
```bash
# Push schema without migration (development only)
npx prisma db push
```

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## ✅ Checklist

- [x] Xóa tất cả Mongoose models
- [x] Xóa mongoose từ package.json
- [x] Xóa MONGODB_URI từ config
- [x] Cập nhật tất cả routes để dùng Prisma
- [x] Cập nhật test scripts
- [x] Cập nhật admin creation scripts
- [x] Cập nhật README
- [x] Tạo migration guide

## 🎉 Kết Luận

Migration hoàn tất! Dự án giờ đây chỉ sử dụng **MySQL với Prisma ORM**, mang lại:
- ✅ Type safety tốt hơn
- ✅ Performance tốt hơn cho relational data
- ✅ Migration management tự động
- ✅ Developer experience tốt hơn
- ✅ Prisma Studio để debug
- ✅ Better tooling và ecosystem

---

**Ngày migration**: January 12, 2026
**Version**: 2.0.0
