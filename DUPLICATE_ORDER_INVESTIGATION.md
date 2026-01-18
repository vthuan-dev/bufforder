# 🔍 Duplicate Order Investigation

## Problem Report
User reports: "Gửi 2 đơn nhẩy lên 4 đơn" (Sent 2 orders but showing 4 orders)

## Investigation Results

### Database Analysis
Ran `test-order-count-v2.js` and found:
- **All orders have `productId: 1`** despite having different product names
- **All orders have `clientRequestId: null`** (idempotency key not being stored)
- Multiple orders created at exactly the same time (1/18/2026, 12:15:34 AM)

### Root Causes Identified

#### 1. **Product ID Issue**
All products are being stored with `productId: 1` regardless of which product was selected.

**Evidence:**
```
Test Product 37 (Product ID: 1)
Test Product 38 (Product ID: 1)
Test Product 39 (Product ID: 1)
...
Test Product 60 (Product ID: 1)
```

**Why this causes "duplicates":**
- Backend duplicate detection checks: same user + same productId within 5 minutes
- Since ALL products have ID 1, the backend thinks they're all the same product
- This should have triggered duplicate detection, but it didn't

#### 2. **Missing Idempotency Key**
All orders show `clientRequestId: none` in database.

**Why this is critical:**
- Idempotency key is the first line of defense against duplicates
- Without it, rapid clicks can create multiple orders
- The frontend IS generating and sending the key, but backend isn't receiving/storing it

#### 3. **Duplicate Detection Not Working**
Despite having:
- Same user
- Same productId (1)
- Same timestamp (within 0.0 seconds)

The backend duplicate detection didn't prevent these orders.

**Possible reasons:**
- The duplicate check happens AFTER order creation in some cases
- Race condition: multiple requests hit the database before any complete
- Transaction isolation level allows concurrent inserts

## Frontend Code Review

### OrdersPage.tsx - Order Submission
```typescript
// ✅ GOOD: Idempotency key generated when popup opens
const handleTakeOrder = () => {
  const newClientRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  setLastClientRequestId(newClientRequestId);
  setShowOrderPopup(true);
}

// ✅ GOOD: Key is passed to API
const handleConfirmOrder = async () => {
  const clientRequestId = lastClientRequestId;
  await api.userOrderTake({
    id: selectedProduct.id,  // ⚠️ This might be a string
    name: selectedProduct.name,
    price: selectedProduct.price,
    brand: selectedProduct.brand,
    category: 'General',
    image: selectedProduct.image,
  }, clientRequestId);
}
```

### api.ts - API Call
```typescript
// ✅ GOOD: Sends key in both header and body
userOrderTake(product, idempotencyKey) {
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  return request('/orders/take', { 
    method: 'POST', 
    headers, 
    body: JSON.stringify({ product, idempotencyKey }) 
  });
}
```

## Backend Code Review

### routes/orders.js - Order Creation
```javascript
// ✅ GOOD: Reads idempotency key from header and body
const clientRequestId = (req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').toString().trim() || null;

// ✅ GOOD: Checks for existing order with same key
if (clientRequestId) {
  const existing = await prisma.order.findFirst({
    where: { userId, clientRequestId }
  });
  if (existing) {
    return res.json({ success: true, data: { /* existing order */ } });
  }
}

// ✅ GOOD: Checks for same product within 5 minutes
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
const recentDuplicate = await prisma.order.findFirst({
  where: {
    userId,
    productId: parseInt(randomProduct.id),  // ⚠️ Converts to int
    orderDate: { gte: fiveMinutesAgo }
  }
});

// ✅ GOOD: Creates order with clientRequestId
const newOrder = await tx.order.create({
  data: {
    userId,
    clientRequestId: clientRequestId || undefined,  // ⚠️ Might be undefined
    productId: parseInt(randomProduct.id),  // ⚠️ Converts to int
    // ...
  }
});
```

## Hypothesis: What Went Wrong

### Scenario 1: Test Data Issue
The "Test Product 37-60" orders might be from a test script or seeding process that:
- Used hardcoded `productId: 1` for all products
- Didn't send idempotency keys
- Created orders in rapid succession

### Scenario 2: Race Condition
If user clicked very rapidly:
1. Click 1: Generates key `abc123`, sends request
2. Click 2: Generates key `def456`, sends request (before Click 1 completes)
3. Both requests check for duplicates at same time
4. Neither finds existing order yet
5. Both create orders

But this doesn't explain why ALL orders have productId 1.

### Scenario 3: Product Selection Bug
Frontend might be sending wrong product ID:
- `selectedProduct.id` might be a string like "1" for all products
- Or products array has wrong IDs
- Backend converts to int, all become 1

## Recommended Fixes

### Fix 1: Add Unique Constraint (Database Level)
```prisma
model Order {
  // ...
  clientRequestId String?
  
  @@unique([userId, clientRequestId])  // Prevent duplicate keys
  @@index([userId, productId, orderDate])  // Speed up duplicate check
}
```

### Fix 2: Improve Duplicate Detection (Backend)
```javascript
// Check BEFORE starting transaction
const [existingByKey, existingByProduct] = await Promise.all([
  clientRequestId ? prisma.order.findFirst({
    where: { userId, clientRequestId }
  }) : null,
  prisma.order.findFirst({
    where: {
      userId,
      productId: parseInt(randomProduct.id),
      orderDate: { gte: fiveMinutesAgo }
    }
  })
]);

if (existingByKey || existingByProduct) {
  return res.json({ success: true, data: { /* existing */ } });
}

// Then create order in transaction
```

### Fix 3: Add Logging (Debug)
```javascript
console.log('[Orders/take] Received:', {
  productId: randomProduct.id,
  productIdType: typeof randomProduct.id,
  clientRequestId,
  clientRequestIdSource: req.headers['x-idempotency-key'] ? 'header' : 'body'
});
```

### Fix 4: Verify Product IDs (Frontend)
Check that products loaded from API have correct unique IDs:
```typescript
useEffect(() => {
  const res = await api.getProducts();
  console.log('Products loaded:', res.data.map(p => ({ id: p.id, name: p.name })));
  setProducts(apiProducts);
}, []);
```

## Next Steps

1. **Verify current state**: Check if this is still happening or was a one-time test data issue
2. **Add logging**: Temporarily add console.logs to see what's being sent/received
3. **Check product data**: Verify products table has unique IDs
4. **Test duplicate detection**: Try rapid clicking to see if it's still possible
5. **Apply fixes**: Implement database constraint and improved duplicate check

## Test Plan

### Test 1: Verify Product IDs
```sql
SELECT id, name FROM Product LIMIT 10;
```
Expected: Each product has unique ID

### Test 2: Rapid Click Test
1. Open Orders page
2. Click "Submit" button 5 times rapidly
3. Check database: Should only have 1 order created
4. Check frontend: Should show correct count

### Test 3: Idempotency Key Test
1. Submit order with key `test-key-123`
2. Check database: `clientRequestId` should be `test-key-123`
3. Submit again with same key
4. Should return existing order, not create new one

---
**Investigation Date**: 2026-01-18
**Status**: Root causes identified, fixes recommended
**Priority**: HIGH (affects order counting and user experience)
