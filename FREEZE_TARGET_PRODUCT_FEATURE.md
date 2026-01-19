# Freeze Target Product Feature - Implementation Guide

## Overview
Admin có thể chỉ định sản phẩm cụ thể sẽ được hiển thị khi user đến đơn ngưỡng freeze, thay vì random.

## Flow:
1. Admin mở modal "Đặt ngưỡng tự động đóng băng"
2. Nhập ngưỡng (ví dụ: 7)
3. Nhập giá sản phẩm mục tiêu (ví dụ: $2000)
4. Hệ thống tìm sản phẩm gần $2000 nhất
5. Hiển thị sản phẩm tìm được (ảnh, tên, giá)
6. Admin xác nhận → Lưu threshold + targetProductId
7. Khi user đến đơn #7 → Hiển thị sản phẩm đã chỉ định

## Implementation Status: ✅ COMPLETE

### Backend ✅ DONE
- [x] API tìm sản phẩm theo giá: `GET /admin/products/find-by-price/:targetPrice`
- [x] API lưu config: `PATCH /admin/users/:id/commission-config` (đã có sẵn)
- [x] Stats API returns `freezeTargetProductId` from user's commissionConfig

### Frontend ✅ COMPLETE
- [x] AdminUsersPage: Added "Số tiền sản phẩm treo" input field
- [x] AdminUsersPage: Added search button with loading state
- [x] AdminUsersPage: Added product display card (image, name, brand, price)
- [x] AdminUsersPage: Search function `handleSearchProductByPrice()` implemented
- [x] AdminUsersPage: Modified `handleConfirmFreezeThreshold()` to save freezeTargetProductId
- [x] OrdersPage: Added `freezeTargetProductId` state
- [x] OrdersPage: Loading freezeTargetProductId from stats API
- [x] OrdersPage: Logic to USE targetProduct instead of random selection when at freeze threshold

## How It Works:

### Admin Side:
1. Admin opens freeze threshold modal for a user
2. Enters threshold (e.g., 7) and target product price (e.g., $2000)
3. Clicks search → System finds closest product within ±20% range
4. Product card displays with image, name, brand, and price
5. Admin confirms → System saves both `autoFreezeThreshold` and `freezeTargetProductId` in user's `commissionConfig`

### User Side:
1. User takes orders normally
2. When reaching freeze threshold order (e.g., order #7):
   - If admin specified a target product → That specific product is shown
   - If no target product → Random product with price > balance is shown (original behavior)
3. User confirms order → Account freezes, order suspended

## Data Structure

### commissionConfig JSON:
```json
{
  "autoFreezeThreshold": 7,
  "freezeTargetProductId": 123,
  "freezeTargetPrice": 2000
}
```

## Files Modified:
- `backend/routes/admin.js` - Added find-by-price API ✅
- `backend/routes/orders.js` - Stats API returns freezeTargetProductId ✅
- `frontend/src/services/api.ts` - Added adminFindProductByPrice() method ✅
- `frontend/src/components/admin/AdminUsersPage.tsx` - Added target product UI ✅
- `frontend/src/components/OrdersPage.tsx` - Added target product logic ✅

## Testing:
1. Admin sets freeze threshold = 7 with target product price = $2000
2. User takes 6 orders normally
3. On order #7, the specific $2000 product (or closest match) is displayed
4. User confirms → Account freezes, order suspended
5. Admin approves deposit → Account unlocks if balance sufficient
