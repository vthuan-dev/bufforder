# Freeze Target Product - Flow Diagram

## 🎯 Complete Feature Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN CONFIGURATION                          │
└─────────────────────────────────────────────────────────────────────┘

1. Admin opens "Đặt ngưỡng tự động đóng băng" modal
   │
   ├─► Enter freeze threshold: 7
   │
   ├─► Enter target product price: $2000
   │
   ├─► Click "Tìm kiếm" button
   │
   ├─► API: GET /admin/products/find-by-price/2000
   │   │
   │   ├─► Search products within ±20% range ($1600 - $2400)
   │   │
   │   └─► Return closest match by price difference
   │
   ├─► Display product card:
   │   ├─ Image
   │   ├─ Name: "Luxury Watch"
   │   ├─ Brand: "Rolex"
   │   └─ Price: $1950.00
   │
   └─► Click "Xác nhận"
       │
       └─► API: PATCH /admin/users/:id/commission-config
           │
           └─► Save to database:
               {
                 "autoFreezeThreshold": 7,
                 "freezeTargetProductId": 123,
                 "freezeTargetPrice": 2000
               }

┌─────────────────────────────────────────────────────────────────────┐
│                         USER EXPERIENCE                              │
└─────────────────────────────────────────────────────────────────────┘

User logs in and starts taking orders:

Order #1 ──► Normal product (price ≤ balance) ──► Success ✅
Order #2 ──► Normal product (price ≤ balance) ──► Success ✅
Order #3 ──► Normal product (price ≤ balance) ──► Success ✅
Order #4 ──► Normal product (price ≤ balance) ──► Success ✅
Order #5 ──► Normal product (price ≤ balance) ──► Success ✅
Order #6 ──► Normal product (price ≤ balance) ──► Success ✅
   │
   │
   ▼
Order #7 (FREEZE THRESHOLD REACHED!)
   │
   ├─► Frontend checks: nextOrderNumber (7) >= freezeThreshold (7) ✅
   │
   ├─► Frontend checks: freezeTargetProductId exists? ✅ (ID: 123)
   │
   ├─► Find product with ID 123 in products array
   │
   ├─► Display SPECIFIC product:
   │   ├─ Name: "Luxury Watch"
   │   ├─ Brand: "Rolex"
   │   ├─ Price: $1950.00 (> user balance)
   │   └─ Commission: $17.55
   │
   ├─► User clicks "Xác nhận đơn hàng"
   │
   ├─► API: POST /orders/take
   │   │
   │   ├─► Backend checks:
   │   │   ├─ nextOrderNumber (7) >= freezeThreshold (7) ✅
   │   │   └─ productPrice ($1950) > userBalance ($500) ✅
   │   │
   │   ├─► Create order with status: "suspended"
   │   │
   │   ├─► Freeze account:
   │   │   ├─ isFrozen = true
   │   │   ├─ frozenBalance = $500 (move from balance)
   │   │   ├─ balance = $0
   │   │   └─ frozenReason = "Insufficient balance..."
   │   │
   │   └─► Return response with accountFrozen flag
   │
   └─► Frontend shows error toast:
       ├─ Title: "Tài khoản bị đóng băng"
       ├─ Message: "Đơn hàng của bạn đã bị treo..."
       └─ Button: "Nạp tiền ngay" → Redirect to /topup

┌─────────────────────────────────────────────────────────────────────┐
│                         UNLOCK MECHANISM                             │
└─────────────────────────────────────────────────────────────────────┘

User deposits money:
   │
   ├─► User deposits $1500
   │
   ├─► Admin approves deposit
   │
   ├─► Backend checks:
   │   ├─ frozenBalance ($500) + deposit ($1500) = $2000
   │   ├─ Suspended order price: $1950
   │   └─ $2000 >= $1950 ✅ (Sufficient!)
   │
   ├─► Auto-unlock account:
   │   ├─ isFrozen = false
   │   ├─ balance = $2000
   │   ├─ frozenBalance = $0
   │   └─ Update suspended order → "pending"
   │
   └─► User can continue taking orders ✅

┌─────────────────────────────────────────────────────────────────────┐
│                         FALLBACK BEHAVIOR                            │
└─────────────────────────────────────────────────────────────────────┘

If freezeTargetProductId is NOT set:
   │
   ├─► At freeze threshold, filter products with price > balance
   │
   ├─► Select RANDOM product from filtered list
   │
   └─► Continue with normal freeze mechanism

If target product ID not found in database:
   │
   ├─► Log warning: "Target product ID 123 not found"
   │
   ├─► Fall back to random selection
   │
   └─► Continue with normal freeze mechanism

┌─────────────────────────────────────────────────────────────────────┐
│                         KEY FEATURES                                 │
└─────────────────────────────────────────────────────────────────────┘

✅ Admin Control: Specify exact product for freeze trigger
✅ Visual Preview: See product before confirming
✅ Price Search: Find products by target price (±20% range)
✅ Fallback Safe: Works even if target product not found
✅ Backward Compatible: Existing freeze mechanism unchanged
✅ Auto-Unlock: Account unlocks when sufficient balance
✅ Real-time Updates: Socket.io for instant notifications

┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

Database (User.commissionConfig):
{
  "autoFreezeThreshold": 7,
  "freezeTargetProductId": 123,
  "freezeTargetPrice": 2000
}
   │
   ├─► Backend: GET /orders/stats
   │   └─► Returns: { freezeThreshold: 7, freezeTargetProductId: 123 }
   │
   ├─► Frontend: OrdersPage loads stats
   │   └─► Sets state: freezeTargetProductId = 123
   │
   ├─► User clicks "Lấy đơn hàng"
   │   └─► handleTakeOrder() checks freezeTargetProductId
   │
   └─► If at threshold + targetProductId exists:
       └─► Use specific product instead of random
```

## 🎨 UI Components

### Admin Modal:
```
┌─────────────────────────────────────────────────┐
│  Đặt ngưỡng tự động đóng băng                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Ngưỡng đơn hàng: [    7    ]                  │
│                                                 │
│  Số tiền sản phẩm treo: [ 2000 ] [Tìm kiếm]    │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  [Image]  Luxury Watch                    │ │
│  │           Rolex                           │ │
│  │           $1950.00                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [ Hủy ]              [ Xác nhận ]              │
└─────────────────────────────────────────────────┘
```

### User Order Popup (at freeze threshold):
```
┌─────────────────────────────────────────────────┐
│  Xác nhận đơn hàng                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Image]  Luxury Watch                          │
│           Rolex                                 │
│                                                 │
│  $1950.00                                  x1   │
│                                                 │
│  Mã đơn hàng: ASH12345678901                    │
│  Tỷ lệ hoa hồng: 1.2%                           │
│  Lợi nhuận từ đơn hàng: $17.55                  │
│                                                 │
│  [ Để sau ]           [ Xác nhận đơn hàng ]     │
└─────────────────────────────────────────────────┘
```

### Freeze Notification:
```
┌─────────────────────────────────────────────────┐
│  🔒 Tài khoản bị đóng băng                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Đơn hàng của bạn đã bị treo do số dư không đủ. │
│  Giá sản phẩm ($1950) vượt quá số dư khả dụng   │
│  ($500). Vui lòng nạp tiền để mở khóa tài khoản.│
│                                                 │
│  Số dư bị đóng băng: $500.00                    │
│                                                 │
│  [ Nạp tiền ngay ]    [ Liên hệ hỗ trợ ]        │
└─────────────────────────────────────────────────┘
```

## 🔍 Debug Logs

### Frontend Console:
```
[Orders] 🎯 Using admin-specified target product at freeze threshold: Luxury Watch - $1950
[Orders] handleConfirmOrder called
[Orders] selectedProduct: {id: "123", name: "Luxury Watch", price: 1950, ...}
[Orders] 🔒 Allowing expensive product at freeze threshold (order #7)
[Orders] Submitting order with key: 1768849560057-4dpw7bfw
[Orders] Order submitted successfully
```

### Backend Console:
```
[Orders/take] VIP-1 freeze check: 6/7 orders (CUSTOM threshold)
[Orders/take] 🔒 Will trigger freeze mechanism after creating suspended order...
[Orders/take] Freeze conditions met: nextOrder=7 >= threshold=7, productPrice=1950 > balance=500
[Orders/take] ✅ Account frozen with suspended order: {userId: "...", orderId: "...", vipLevel: "vip-1", frozenBalance: 500, ...}
```

---

**Last Updated**: January 20, 2026  
**Status**: ✅ Production Ready
