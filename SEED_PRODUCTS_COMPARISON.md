# So sánh các file Seed Products

## 📊 Bảng so sánh chi tiết

| File | Số lượng | Nguồn ảnh | Categories | Giá | Product URL | Thời gian | Khuyến nghị |
|------|----------|-----------|------------|-----|-------------|-----------|-------------|
| **modern-products-data.json** | 20 | Unsplash | Smartphones, Laptops | $699-$3499 | ✅ Có | ⚡ Nhanh (1s) | Test/Demo |
| **seed-1000-real-products.js** | 1000 | Unsplash (unique) | 10 categories | $10-$3000 | ✅ Có | 🕐 Trung bình (30s) | ⭐ Production |
| **seed-1600-real-products.js** | 1600 | Unsplash | 8 categories | $50-$2500 | ✅ Có | 🕐 Trung bình (45s) | Production |
| **seed-2k-products.js** | 2000 | Generic URLs | 8 categories | $10-$3000 | ❌ Không | 🕐 Lâu (60s) | Nhiều data |
| **seed-diverse-products.js** | 2000 | Unsplash | 10 categories | $10-$3000 | ❌ Không | 🕐 Lâu (60s) | Đa dạng |
| **seed-unique-products.js** | 2000 | Unsplash | 10 categories | $10-$3000 | ❌ Không | 🕐 Lâu (60s) | Unique names |
| **seed-from-dummyjson.js** | ~100 | DummyJSON API | Mixed | API data | ✅ Có | ⚡ Nhanh (5s) | Test API |

---

## 📝 Chi tiết từng file

### 1. modern-products-data.json (20 products)
**Ưu điểm:**
- ✅ Data thật từ Apple, Samsung, Google
- ✅ Có product URLs chính thức
- ✅ Ảnh Unsplash chất lượng cao
- ✅ Nhanh nhất, phù hợp test

**Nhược điểm:**
- ❌ Quá ít cho production
- ❌ Chỉ có 2 categories

**Dùng khi:** Test nhanh, demo, development

---

### 2. seed-1000-real-products.js (1000 products) ⭐ KHUYẾN NGHỊ
**Ưu điểm:**
- ✅ Cân bằng số lượng và chất lượng
- ✅ Unsplash images với unique URLs
- ✅ 10 categories đa dạng: smartphones, laptops, watches, handbags, sneakers, headphones, cameras, tablets, smartwatches, sunglasses
- ✅ Có product URLs
- ✅ Giá realistic ($10-$3000)
- ✅ Tên sản phẩm unique (dùng index để tránh duplicate)

**Nhược điểm:**
- ⚠️ Mất ~30 giây để seed
- ⚠️ Cần ~50MB RAM

**Dùng khi:** Production, staging, có nhiều users

**Code sample:**
```javascript
// Tạo unique image cho mỗi product
function generateUniqueUnsplashImage(category, index) {
  const queries = {
    smartphone: ['iphone', 'samsung-phone', 'android-phone', ...],
    laptop: ['macbook', 'laptop-desk', 'computer-work', ...],
    // ... 8 categories khác
  };
  return `https://images.unsplash.com/photo-${1500000000000 + index}?w=800&q=80`;
}
```

---

### 3. seed-1600-real-products.js (1600 products)
**Ưu điểm:**
- ✅ Nhiều products hơn seed-1000
- ✅ Unsplash images
- ✅ 8 categories
- ✅ Có product URLs

**Nhược điểm:**
- ⚠️ Mất ~45 giây
- ⚠️ Cần ~80MB RAM
- ⚠️ Có thể overkill cho VPS nhỏ

**Dùng khi:** Cần nhiều data, VPS có RAM đủ (>2GB)

---

### 4. seed-2k-products.js (2000 products)
**Ưu điểm:**
- ✅ Nhiều products nhất
- ✅ 8 categories: Electronics, Fashion, Home, Sports, Beauty, Toys, Books, Automotive
- ✅ Có variations (colors, sizes, materials)

**Nhược điểm:**
- ❌ Ảnh generic (cùng URL cho nhiều products)
- ❌ Không có product URLs
- ❌ Mất ~60 giây
- ❌ Có thể duplicate names

**Dùng khi:** Cần test với data lớn, không quan tâm ảnh

**Code sample:**
```javascript
// Tạo variations
function generateProductVariations(baseProduct, count) {
  const colors = ['Black', 'White', 'Blue', ...];
  const sizes = ['Small', 'Medium', 'Large', ...];
  // Tạo variations với colors + sizes
}
```

---

### 5. seed-diverse-products.js (2000 products)
**Ưu điểm:**
- ✅ 2000 products đa dạng
- ✅ Unsplash images
- ✅ 10 categories
- ✅ Tên products đa dạng

**Nhược điểm:**
- ❌ Không có product URLs
- ❌ Mất ~60 giây
- ❌ Tốn RAM

**Dùng khi:** Cần data đa dạng, test performance

---

### 6. seed-unique-products.js (2000 products)
**Ưu điểm:**
- ✅ Tên products unique (dùng adjectives + nouns)
- ✅ Unsplash images
- ✅ 10 categories
- ✅ Không duplicate

**Nhược điểm:**
- ❌ Không có product URLs
- ❌ Mất ~60 giây
- ❌ Tên có thể weird (vì random)

**Dùng khi:** Cần tên unique, test search/filter

**Code sample:**
```javascript
const adjectives = ['Premium', 'Luxury', 'Modern', 'Classic', ...];
const nouns = ['Collection', 'Series', 'Edition', 'Line', ...];
// Tạo tên: "Premium Smartphone Collection #123"
```

---

### 7. seed-from-dummyjson.js (~100 products)
**Ưu điểm:**
- ✅ Data thật từ DummyJSON API
- ✅ Có ratings, descriptions
- ✅ Có product URLs
- ✅ Nhanh (~5 giây)

**Nhược điểm:**
- ❌ Ít products (~100)
- ❌ Phụ thuộc API external
- ❌ Có thể bị rate limit

**Dùng khi:** Test với real API data, development

---

## 🎯 Khuyến nghị theo use case

### Production (VPS 1GB RAM):
```bash
node backend/seed-1000-real-products.js
```
- Cân bằng số lượng và chất lượng
- Ảnh đẹp, unique
- Không quá tải RAM

### Production (VPS >2GB RAM):
```bash
node backend/seed-1600-real-products.js
```
- Nhiều products hơn
- Vẫn giữ chất lượng

### Test/Development:
```bash
node seed-modern-products.js
```
- Nhanh, ít data
- Đủ để test features

### Demo với nhiều data:
```bash
node backend/seed-2k-products.js
```
- Nhiều products
- Test performance

### Test API integration:
```bash
node backend/seed-from-dummyjson.js
```
- Real API data
- Có ratings, descriptions

---

## 💡 Tips

1. **Xóa products cũ trước khi seed:**
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.deleteMany().then(() => console.log('Deleted')).finally(() => prisma.\$disconnect());"
   ```

2. **Kiểm tra số lượng hiện tại:**
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.count().then(count => console.log('Total:', count)).finally(() => prisma.\$disconnect());"
   ```

3. **Seed theo batch để tránh timeout:**
   - Các file seed đã implement batch insert (100 products/batch)

4. **Monitor RAM khi seed:**
   ```bash
   watch -n 1 free -h
   ```

---

## 🏆 Kết luận

**Tốt nhất cho production:** `seed-1000-real-products.js`
- Đủ nhiều (1000 products)
- Chất lượng cao (Unsplash images)
- Có product URLs
- Không quá tải VPS
