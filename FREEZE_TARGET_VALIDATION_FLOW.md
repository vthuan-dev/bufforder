# 🔄 Freeze Target Product Validation Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Opens "Đặt ngưỡng đóng băng" Modal                   │
│  User: John Doe | Balance: $1,500.00                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Admin Enters:                                               │
│  • Freeze Threshold: 7                                       │
│  • Target Product Price: $2,000                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Auto-search (500ms debounce)                                │
│  → API: GET /admin/products/find-by-price/2000              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Dropdown Shows 10 Products:                                 │
│  ✓ Luxury Watch - Rolex - $1,950                            │
│  ✓ Designer Bag - Gucci - $2,100                            │
│  ✓ Laptop Pro - Apple - $2,200                              │
│  ... (7 more)                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Admin Selects: "Luxury Watch - $1,950"                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Admin Clicks "Xác nhận"                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │  VALIDATION   │
                    └───────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│  SCENARIO A:     │                  │  SCENARIO B:     │
│  Price > Balance │                  │  Price ≤ Balance │
│  $1,950 > $1,500 │                  │  $1,200 ≤ $1,500 │
│  ✅ VALID        │                  │  ❌ INVALID      │
└──────────────────┘                  └──────────────────┘
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│  Save Config:    │                  │  Show Error:     │
│  • threshold: 7  │                  │  "Giá sản phẩm   │
│  • productId:123 │                  │  treo ($1200)    │
│  • price: $1,950 │                  │  phải lớn hơn    │
└──────────────────┘                  │  số dư ($1500)"  │
        ↓                              └──────────────────┘
┌──────────────────┐                           ↓
│  Success Toast:  │                  ┌──────────────────┐
│  "Đã đặt ngưỡng  │                  │  Modal Stays     │
│  7 với sản phẩm  │                  │  Open - Admin    │
│  Luxury Watch"   │                  │  Can Correct     │
└──────────────────┘                  └──────────────────┘
        ↓
┌──────────────────┐
│  Close Modal     │
│  Reload Page     │
└──────────────────┘
```

## 🎯 Validation Logic

### Code Flow:
```typescript
handleConfirmFreezeThreshold() {
  // Step 1: Validate threshold (existing)
  if (threshold <= currentOrders) → ERROR
  if (threshold >= maxOrders) → ERROR
  
  // Step 2: Validate target product price (NEW)
  if (targetProduct.price <= user.balance) → ERROR ❌
  
  // Step 3: Save configuration
  if (all validations pass) → SAVE ✅
}
```

### Validation Check:
```typescript
// NEW VALIDATION
if (targetProduct && targetProduct.price <= freezeThresholdUser.balance) {
  toast.error(t('freezeThresholdDialog.errorProductPriceTooLow', { 
    price: targetProduct.price.toFixed(2),     // e.g., "1200.00"
    balance: freezeThresholdUser.balance.toFixed(2)  // e.g., "1500.00"
  }));
  return; // Stop execution, don't save
}
```

## 📊 Real-World Examples

### Example 1: ✅ Valid Configuration
```
User Balance: $1,000.00
Target Product: "iPhone 15 Pro" - $1,299.00
Validation: $1,299 > $1,000 → ✅ PASS
Result: Configuration saved successfully
```

### Example 2: ❌ Invalid Configuration
```
User Balance: $2,500.00
Target Product: "Smart Watch" - $899.00
Validation: $899 ≤ $2,500 → ❌ FAIL
Result: Error shown, not saved
```

### Example 3: ❌ Edge Case - Equal
```
User Balance: $1,500.00
Target Product: "Tablet" - $1,500.00
Validation: $1,500 ≤ $1,500 → ❌ FAIL
Result: Error shown (must be GREATER, not equal)
```

### Example 4: ✅ No Target Product
```
User Balance: $1,000.00
Target Product: Not selected
Validation: Skipped (no target product)
Result: Saves with default random selection
```

## 🔍 Why Price Must Be Greater (Not Equal)

### If Price = Balance:
```
User Balance: $1,500.00
Product Price: $1,500.00
User takes order → Balance becomes $1,500.00
Product costs $1,500.00
User CAN afford it! → NO FREEZE ❌
```

### If Price > Balance:
```
User Balance: $1,500.00
Product Price: $1,950.00
User takes order → Balance becomes $1,500.00
Product costs $1,950.00
User CANNOT afford it! → FREEZE TRIGGERS ✅
```

## 🎨 User Experience

### Before Validation (Problem):
1. Admin sets product price = $1,200
2. User balance = $1,500
3. System saves configuration ❌
4. User reaches threshold
5. Sees $1,200 product
6. Can afford it → No freeze
7. **Freeze mechanism broken!** ❌

### After Validation (Solution):
1. Admin tries to set product price = $1,200
2. User balance = $1,500
3. System validates: $1,200 ≤ $1,500 ❌
4. Shows error immediately
5. Admin corrects to $2,000 product
6. System validates: $2,000 > $1,500 ✅
7. Saves successfully
8. **Freeze mechanism guaranteed!** ✅

## 📱 Error Message Display

### Vietnamese:
```
🔴 Giá sản phẩm treo ($1,200.00) phải lớn hơn số dư hiện tại của user ($1,500.00)
```

### English:
```
🔴 Target product price ($1,200.00) must be greater than user's current balance ($1,500.00)
```

**Features:**
- Shows exact amounts with 2 decimal places
- Clear comparison between product price and balance
- Bilingual support
- Toast notification (auto-dismisses)

## ✅ Validation Checklist

When admin clicks "Xác nhận", system checks:

- [ ] Is threshold value valid? (if provided)
- [ ] Is threshold > current orders?
- [ ] Is threshold < max orders?
- [ ] **Is target product price > user balance?** ← NEW
- [ ] All checks pass? → Save configuration ✅
- [ ] Any check fails? → Show error, keep modal open ❌

---

**Implementation Date**: January 20, 2026  
**Status**: ✅ Production Ready
