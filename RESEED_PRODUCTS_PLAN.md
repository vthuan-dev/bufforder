# Kế hoạch Reseed Products

## 📋 Tổng quan

Xóa tất cả sản phẩm hiện tại và seed lại với 18 sản phẩm cao cấp có ảnh thật từ các trang thương mại điện tử Việt Nam.

## 🎯 File sử dụng

**File:** `backend/seed-products.js`

**Lý do chọn:**
- ✅ 18 sản phẩm cao cấp (Rolex, Hermès, Chanel, Gucci, Apple, Samsung...)
- ✅ Ảnh thật từ các trang: 24kara.com, shopee.vn, ebay.com
- ✅ Giá realistic: $345 - $25,000
- ✅ Đa dạng categories: Watches, Handbags, Shoes, Jewelry, Electronics, Beauty, Accessories
- ✅ Chất lượng cao, phù hợp production

## 📦 Danh sách 18 sản phẩm

### Watches (5 sản phẩm)
1. Rolex Submariner - $8,500
2. Omega Speedmaster - $5,500
3. Patek Philippe Calatrava - $25,000
4. Audemars Piguet Royal Oak - $18,000
5. Cartier Santos - $7,200

### Handbags (2 sản phẩm)
6. Hermès Birkin Bag - $15,000
7. Chanel Classic Flap - $8,500

### Shoes (2 sản phẩm)
8. Balenciaga Triple S Sneakers - $1,200
9. Off-White Air Jordan 1 - $1,800

### Jewelry (2 sản phẩm)
10. Tiffany & Co. Diamond Ring - $12,000
11. Cartier Love Bracelet - $8,500

### Accessories (2 sản phẩm)
12. Hermès Silk Scarf - $450
13. Gucci GG Belt - $650

### Electronics (3 sản phẩm)
14. Apple iPhone 17 Pro - $1,299
15. Samsung Galaxy S24 Ultra - $1,199
16. Sony WH-1000XM5 Headphones - $399

### Beauty (2 sản phẩm)
17. Dyson Supersonic Hair Dryer - $429
18. La Mer Moisturizing Cream - $345

## 🚀 Cách chạy

### Trên VPS (Khuyến nghị):

```bash
# SSH vào VPS
ssh root@180.93.35.4

# Chạy script reseed
cd /var/www/greeting-message
bash vps-reseed-products.sh
```

### Hoặc chạy từng lệnh:

```bash
# SSH vào VPS
ssh root@180.93.35.4

# Navigate to backend
cd /var/www/greeting-message/backend

# Xóa products cũ
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.deleteMany().then(() => console.log('Deleted')).finally(() => prisma.\$disconnect());"

# Seed products mới
node seed-products.js

# Kiểm tra số lượng
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.count().then(count => console.log('Total:', count)).finally(() => prisma.\$disconnect());"
```

## ✅ Kiểm tra kết quả

1. Truy cập admin panel: https://ashfordorder.com/admin/products
2. Login với:
   - Username: `admin`
   - Password: `admin123`
3. Kiểm tra:
   - Có đúng 18 sản phẩm
   - Ảnh hiển thị đúng
   - Giá và thông tin chính xác

## 🔍 Nguồn ảnh

Tất cả ảnh đều từ các trang thương mại điện tử thật:
- 24kara.com (đồng hồ cao cấp)
- shopee.vn (điện tử, mỹ phẩm)
- ebay.com (hàng hiệu)
- Các trang chính thức khác

## 📊 So với các file seed khác

| File | Số lượng | Chất lượng ảnh | Phù hợp |
|------|----------|----------------|---------|
| **seed-products.js** | 18 | ⭐⭐⭐⭐⭐ Ảnh thật | ✅ Production |
| seed-1000-real-products.js | 1000 | ⭐⭐⭐⭐ Unsplash | Production lớn |
| modern-products-data.json | 20 | ⭐⭐⭐⭐ Unsplash | Test/Demo |
| seed-2k-products.js | 2000 | ⭐⭐ Generic | Test data lớn |

## 💡 Lưu ý

- Script sẽ xóa TẤT CẢ sản phẩm hiện tại
- Không ảnh hưởng đến orders, users, hay data khác
- Thời gian chạy: ~5 giây
- RAM sử dụng: ~10MB
