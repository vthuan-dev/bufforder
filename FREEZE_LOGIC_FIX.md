# 🔒 Fix: Freeze Logic - Chỉ Cho Phép Khi Admin Set

## 🐛 VẤN ĐỀ

### **Tình huống:**
```
User có balance: $5,155.52
Nhưng nhận được đơn: $10,115.69 (price > balance)
→ User vẫn confirm được
→ SAI! Không nên cho phép khi admin KHÔNG set freeze
```

### **Nguyên nhân:**

1. **Backend API (`/api/orders/stats`):**
   ```javascript
   // ❌ SAI: Tự động tính threshold = 85% orders
   if (customThreshold != null) {
     freezeThreshold = customThreshold;
   } else {
     freezeThreshold = Math.floor(effectiveNumberOfOrders * 0.85); // ← BUG!
   }
   ```
   → Frontend nhận `freezeThreshold = 85` dù admin KHÔNG set gì

2. **Frontend (`OrdersPage.tsx`):**
   ```javascript
   // ❌ SAI: Chỉ check threshold != null
   const isAtFreezeThreshold = freezeThreshold != null && nextOrderNumber >= threshold;
   
   if (isAtFreezeThreshold) {
     // Cho phép price > balance
     filteredProducts = products.filter(p => p.price > balance);
   }
   ```
   → Cho phép đơn đắt tiền dù admin KHÔNG bật freeze

3. **Backend (`/api/orders/take`):**
   ```javascript
   // ✅ Backend logic đúng - chỉ freeze khi enabled
   if (freezeConfig.enabled) {
     // Check conditions...
   }
   ```
   → Nhưng frontend đã cho user confirm rồi!

## ✅ GIẢI PHÁP

### **1. Backend API - Chỉ Trả Threshold Khi Admin Set**

**File:** `backend/routes/orders.js`

```javascript
// ✅ FIXED: Chỉ set threshold khi admin explicitly configured
if (user.vipLevel !== 'vip-0' && !user.isFrozen && effectiveNumberOfOrders > 0) {
  const commissionConfig = parseJsonField(user.commissionConfig, {});
  const customThreshold = resolveAutoFreezeThreshold(user);

  // Only set threshold if admin explicitly configured it
  if (customThreshold != null && customThreshold > 0) {
    freezeThreshold = customThreshold;
    freezeTargetProductId = commissionConfig.freezeTargetProductId || null;
  }
  // ❌ REMOVED: Auto-calculation of 85% threshold
}
```

**Kết quả:**
- Admin KHÔNG set → `freezeThreshold = null`
- Admin set → `freezeThreshold = giá trị admin set`

### **2. Frontend - Kiểm Tra Cả Threshold VÀ Target Product**

**File:** `frontend/src/components/OrdersPage.tsx`

#### **Fix 1: Balance Check (line ~448)**
```javascript
// ✅ FIXED: Chỉ cho phép price > balance khi admin EXPLICITLY set freeze
const adminEnabledFreeze = freezeThreshold != null && freezeTargetProductId != null;
const isAtAdminFreezePoint = adminEnabledFreeze && nextOrderNumber >= freezeThreshold;

// ALWAYS check balance, except when admin explicitly set freeze point
if (!isAtAdminFreezePoint && availableBalance < selectedProduct.price) {
  toast.error('Insufficient balance');
  return;
}
```

#### **Fix 2: Product Selection (line ~360)**
```javascript
// ✅ FIXED: Chỉ filter expensive products khi admin set freeze
const adminEnabledFreeze = freshFreezeThreshold != null && freshFreezeTargetProductId != null;
const isAtAdminFreezePoint = adminEnabledFreeze && nextOrderNumber >= freshFreezeThreshold;

if (isAtAdminFreezePoint) {
  // Admin configured freeze: cho phép price > balance
  filteredProducts = products.filter(p => p.price > balance);
} else {
  // Normal: chỉ products user có đủ tiền
  filteredProducts = products.filter(p => p.price <= balance);
}
```

## 🎯 LOGIC MỚI

### **Điều kiện để cho phép price > balance:**

```javascript
adminEnabledFreeze = (freezeThreshold != null) && (freezeTargetProductId != null)
```

**Giải thích:**
- `freezeThreshold != null` → Admin đã set threshold
- `freezeTargetProductId != null` → Admin đã chọn target product
- **CẢ HAI** phải có → Mới cho phép expensive products

### **Các trường hợp:**

| Admin Set Threshold | Admin Set Target Product | Kết quả |
|---------------------|-------------------------|---------|
| ❌ No | ❌ No | ✅ Chỉ cho phép price ≤ balance |
| ✅ Yes | ❌ No | ✅ Chỉ cho phép price ≤ balance |
| ❌ No | ✅ Yes | ✅ Chỉ cho phép price ≤ balance |
| ✅ Yes | ✅ Yes | 🔒 Cho phép price > balance tại threshold |

## 🧪 TEST CASES

### **Case 1: Admin KHÔNG set gì**
```
User balance: $5,000
Admin config: {}

→ freezeThreshold = null
→ freezeTargetProductId = null
→ adminEnabledFreeze = false
→ Chỉ hiện products ≤ $5,000
→ ✅ PASS
```

### **Case 2: Admin chỉ set threshold**
```
User balance: $5,000
Admin config: { autoFreezeThreshold: 85 }

→ freezeThreshold = 85
→ freezeTargetProductId = null
→ adminEnabledFreeze = false
→ Chỉ hiện products ≤ $5,000
→ ✅ PASS
```

### **Case 3: Admin set đầy đủ**
```
User balance: $5,000
Admin config: { 
  autoFreezeThreshold: 85,
  freezeTargetProductId: 123
}

→ freezeThreshold = 85
→ freezeTargetProductId = 123
→ adminEnabledFreeze = true
→ Tại order #85: hiện products > $5,000
→ ✅ PASS (freeze mechanism hoạt động)
```

## 📝 SUMMARY

**Thay đổi:**
1. ✅ Backend: Bỏ auto-calculate 85% threshold
2. ✅ Frontend: Kiểm tra CẢ threshold VÀ target product
3. ✅ Logic: Chỉ cho phép expensive products khi admin EXPLICITLY set

**Kết quả:**
- Admin KHÔNG set → User chỉ nhận đơn có price ≤ balance
- Admin set đầy đủ → Freeze mechanism hoạt động bình thường
- Không còn bug "nhận đơn đắt tiền khi không nên"

**Files changed:**
- `backend/routes/orders.js` (line ~108-120)
- `frontend/src/components/OrdersPage.tsx` (line ~360, ~448)
