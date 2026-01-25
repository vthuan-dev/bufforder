# 📦 Phân Tích Schema của Products

## 1. Cấu Trúc Bảng Product

```prisma
model Product {
  id         Int      @id @default(autoincrement())
  name       String
  brand      String
  category   String
  price      Float
  image      String?  @db.Text
  productUrl String?  @db.Text
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([category], map: "Product_category_idx")
  @@index([isActive], map: "Product_isActive_idx")
  @@map("product")
}
```

## 2. Chi Tiết Các Trường (Fields)

### 2.1 Primary Key
- **id**: `Int` - Auto-increment
  - Khóa chính của bảng
  - Tự động tăng khi thêm sản phẩm mới
  - Dùng để tham chiếu trong bảng Order

### 2.2 Thông Tin Cơ Bản
- **name**: `String` (Required)
  - Tên sản phẩm
  - Ví dụ: "iPhone 15 Pro Max 256GB", "Samsung Galaxy S24 Ultra"

- **brand**: `String` (Required)
  - Thương hiệu/nhãn hiệu
  - Ví dụ: "Apple", "Samsung", "Sony", "Generic"

- **category**: `String` (Required)
  - Danh mục sản phẩm
  - Ví dụ: "smartphones", "laptops", "electronics", "beauty", "furniture"
  - Có index để tìm kiếm nhanh theo category

- **price**: `Float` (Required)
  - Giá sản phẩm (USD)
  - Kiểu số thực để hỗ trợ giá lẻ (ví dụ: 1199.99)

### 2.3 Media & Links
- **image**: `String?` (Optional) - `@db.Text`
  - URL của hình ảnh sản phẩm
  - Nullable (có thể null)
  - Dùng kiểu TEXT trong MySQL để lưu URL dài
  - Ví dụ: "https://images.unsplash.com/photo-xxx"

- **productUrl**: `String?` (Optional) - `@db.Text`
  - Link đến trang chi tiết sản phẩm
  - Nullable (có thể null)
  - Dùng kiểu TEXT trong MySQL
  - Ví dụ: "https://www.apple.com/iphone-15-pro/"

### 2.4 Status & Timestamps
- **isActive**: `Boolean` - Default: `true`
  - Trạng thái kích hoạt của sản phẩm
  - `true`: Sản phẩm đang hoạt động, có thể tạo order
  - `false`: Sản phẩm bị vô hiệu hóa
  - Có index để filter nhanh

- **createdAt**: `DateTime` - Default: `now()`
  - Thời gian tạo sản phẩm
  - Tự động set khi insert

- **updatedAt**: `DateTime` - Auto-update
  - Thời gian cập nhật gần nhất
  - Tự động update khi có thay đổi

## 3. Indexes (Chỉ Mục)

### 3.1 Category Index
```prisma
@@index([category], map: "Product_category_idx")
```
- Tăng tốc query theo category
- Hữu ích khi filter sản phẩm theo danh mục

### 3.2 IsActive Index
```prisma
@@index([isActive], map: "Product_isActive_idx")
```
- Tăng tốc query sản phẩm active/inactive
- Quan trọng khi chỉ lấy sản phẩm đang hoạt động

## 4. Quan Hệ với Bảng Khác

### 4.1 Không Có Foreign Key Trực Tiếp
- Bảng Product **KHÔNG** có relation trực tiếp với bảng Order trong Prisma schema
- Lý do: Sử dụng `productId` (Int) trong Order để tham chiếu, nhưng không định nghĩa relation

### 4.2 Cách Sử Dụng trong Order
```prisma
model Order {
  productId        Int      // Tham chiếu đến Product.id
  productName      String   // Lưu snapshot tên sản phẩm
  productPrice     Float    // Lưu snapshot giá tại thời điểm order
  brand            String?  // Lưu snapshot brand
  category         String?  // Lưu snapshot category
  image            String?  // Lưu snapshot image
  // ... các field khác
}
```

**Lưu ý quan trọng:**
- Order lưu **snapshot** của product data tại thời điểm tạo order
- Nếu product bị xóa hoặc thay đổi giá, order vẫn giữ nguyên thông tin cũ
- Đây là pattern "denormalization" để đảm bảo tính toàn vẹn dữ liệu lịch sử

## 5. Cách Sử Dụng Thực Tế

### 5.1 Seeding Products
Hệ thống sử dụng DummyJSON API để seed products:
```javascript
// Fetch từ API
const response = await fetch('https://dummyjson.com/products?limit=194');

// Transform data
const products = data.products.map(product => ({
  name: product.title,
  brand: product.brand || 'Generic',
  category: product.category || 'General',
  price: parseFloat(product.price),
  image: product.thumbnail || product.images?.[0] || null,
  productUrl: `https://dummyjson.com/products/${product.id}`,
  isActive: true
}));

// Insert vào database
await prisma.product.createMany({ data: products });
```

### 5.2 Thêm Flagship Products
Ngoài products từ API, hệ thống còn thêm 6 sản phẩm flagship với:
- Hình ảnh chất lượng cao từ Unsplash
- Thông tin chi tiết hơn
- Link đến trang chính thức của nhà sản xuất

### 5.3 Query Patterns Phổ Biến

#### Lấy sản phẩm active
```javascript
const products = await prisma.product.findMany({
  where: { isActive: true }
});
```

#### Lấy theo category
```javascript
const smartphones = await prisma.product.findMany({
  where: { 
    category: 'smartphones',
    isActive: true 
  }
});
```

#### Thống kê theo category
```javascript
const categories = await prisma.product.groupBy({
  by: ['category'],
  _count: true
});
```

## 6. Ưu & Nhược Điểm của Schema

### ✅ Ưu Điểm
1. **Đơn giản, dễ hiểu**: Schema rõ ràng, không phức tạp
2. **Performance tốt**: Có indexes hợp lý cho category và isActive
3. **Flexible**: Hỗ trợ nhiều loại sản phẩm khác nhau
4. **Snapshot pattern**: Order lưu snapshot nên không bị ảnh hưởng khi product thay đổi

### ⚠️ Nhược Điểm & Cân Nhắc
1. **Không có relation constraint**: 
   - Order.productId không có foreign key
   - Có thể tạo order với productId không tồn tại
   - Cần validate ở application layer

2. **Thiếu thông tin chi tiết**:
   - Không có description (mô tả sản phẩm)
   - Không có stock/inventory (số lượng tồn kho)
   - Không có rating/reviews
   - Không có variants (màu sắc, kích thước)

3. **Image handling đơn giản**:
   - Chỉ lưu 1 image URL
   - Không có gallery/multiple images
   - Không có image optimization

4. **Category không chuẩn hóa**:
   - Category là String tự do
   - Không có bảng Category riêng
   - Có thể dẫn đến inconsistency (ví dụ: "smartphone" vs "smartphones")

## 7. Đề Xuất Cải Tiến (Nếu Cần)

### 7.1 Thêm Foreign Key Constraint
```prisma
model Order {
  productId Int
  product   Product @relation(fields: [productId], references: [id])
  // ...
}

model Product {
  id     Int     @id @default(autoincrement())
  orders Order[]
  // ...
}
```

### 7.2 Thêm Fields Hữu Ích
```prisma
model Product {
  // ... existing fields
  description  String?  @db.Text
  stock        Int      @default(0)
  rating       Float?
  reviewCount  Int      @default(0)
  sku          String?  @unique
  weight       Float?
  dimensions   String?
}
```

### 7.3 Chuẩn Hóa Category
```prisma
model Category {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  slug     String    @unique
  products Product[]
}

model Product {
  categoryId Int
  category   Category @relation(fields: [categoryId], references: [id])
  // ...
}
```

## 8. Kết Luận

Schema của Product hiện tại:
- ✅ **Phù hợp** cho MVP và hệ thống đơn giản
- ✅ **Performance tốt** với indexes hợp lý
- ✅ **Dễ maintain** và scale theo chiều ngang
- ⚠️ **Cần cải tiến** nếu muốn thêm tính năng phức tạp (inventory, variants, reviews)

Đối với use case hiện tại (tạo orders với commission), schema này **hoàn toàn đủ dùng** và không cần thay đổi gì thêm.
