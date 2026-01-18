# Design Document: Order Duplicate Prevention

## Overview

This design implements comprehensive duplicate order prevention by fixing idempotency key storage, moving duplicate checks before transactions, and adding database constraints.

## Architecture

### Current Flow (Has Issues)
```
1. Request arrives → Extract idempotency key
2. Start transaction
3. Check for duplicates (INSIDE transaction - race condition!)
4. Create order with clientRequestId
5. Commit transaction
```

### New Flow (Fixed)
```
1. Request arrives → Extract idempotency key
2. Check for duplicates BEFORE transaction (prevents race conditions)
3. If duplicate found → Return existing order
4. If no duplicate → Start transaction
5. Create order with clientRequestId
6. Commit transaction
7. Database constraint provides final safety net
```

## Components

### 1. Backend: Order Creation Endpoint (`backend/routes/orders.js`)

#### Changes to POST /api/orders/take

**Current Issues:**
- Idempotency key extraction uses `|| ''` which becomes empty string, then `|| undefined` makes it NULL
- Duplicate checks happen inside `$transaction()` - race condition
- No logging for debugging

**Fixes:**

```javascript
// BEFORE TRANSACTION - Extract and validate idempotency key
const clientRequestId = (
  req.headers['x-idempotency-key'] || 
  req.body?.idempotencyKey || 
  ''
).toString().trim() || null;

console.log('[Orders/take] Idempotency key:', clientRequestId);

// BEFORE TRANSACTION - Check for duplicate by idempotency key
if (clientRequestId) {
  const existingByKey = await prisma.order.findFirst({
    where: { 
      userId, 
      clientRequestId 
    }
  });
  
  if (existingByKey) {
    console.log('[Orders/take] ✅ Duplicate detected via idempotency key:', clientRequestId);
    return res.json({
      success: true,
      data: {
        // Return existing order data
        ...buildOrderResponse(existingByKey, user, currentDailyEarnings)
      }
    });
  }
}

// BEFORE TRANSACTION - Check for duplicate by time window (5 minutes)
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
const existingByTime = await prisma.order.findFirst({
  where: {
    userId,
    productId: parseInt(randomProduct.id),
    orderDate: { gte: fiveMinutesAgo }
  }
});

if (existingByTime) {
  console.log('[Orders/take] ✅ Duplicate detected: same product within 5 minutes');
  return res.json({
    success: true,
    data: {
      // Return existing order data
      ...buildOrderResponse(existingByTime, user, currentDailyEarnings)
    }
  });
}

// NOW START TRANSACTION - No duplicates found
const result = await prisma.$transaction(async (tx) => {
  const newOrder = await tx.order.create({
    data: {
      userId,
      clientRequestId, // ✅ Store the key (not undefined)
      orderNumber: generateOrderNumber(),
      productId: parseInt(randomProduct.id),
      // ... rest of order data
    }
  });
  
  // ... rest of transaction
});
```

**Helper Function:**
```javascript
// Helper to build consistent order response
function buildOrderResponse(order, user, dailyEarnings) {
  return {
    newCommission: user.commission,
    newBalance: user.balance,
    newCompletedToday: todayOrders.length,
    newOrdersGrabbed: todayOrders.length,
    selectedProduct: {
      productName: order.productName,
      productPrice: order.productPrice,
      commissionAmount: order.commissionAmount,
      commissionRate: order.commissionRate,
      brand: order.brand,
      productId: order.productId,
      category: order.category,
      image: order.image
    },
    order: {
      id: order.id,
      status: order.status,
      orderDate: order.orderDate
    },
    dailyEarnings
  };
}
```

### 2. Database: Schema Changes (`backend/prisma/schema.prisma`)

**Current Schema:**
```prisma
model Order {
  id               String    @id @default(cuid())
  userId           String
  clientRequestId  String?
  // ... other fields
  
  @@unique([userId, clientRequestId], map: "Order_userId_clientRequestId_key")
  @@index([userId, orderDate], map: "Order_userId_orderDate_idx")
}
```

**Issue:** The unique constraint exists BUT it allows multiple NULL values for `clientRequestId`!
In MySQL, `NULL != NULL`, so multiple `(userId, NULL)` pairs are allowed.

**Solution:** Keep the constraint (it works for non-NULL keys), but rely on application logic for NULL handling.

**Additional Index Needed:**
```prisma
model Order {
  // ... existing fields
  
  @@unique([userId, clientRequestId], map: "Order_userId_clientRequestId_key")
  @@index([userId, orderDate], map: "Order_userId_orderDate_idx")
  @@index([userId, productId, orderDate], map: "Order_userId_productId_orderDate_idx") // NEW
}
```

This index optimizes the time-window duplicate check query.

### 3. Frontend: Verification (`frontend/src/components/OrdersPage.tsx`)

**Current Implementation:** ✅ Already correct!
- Generates idempotency key when popup opens (line 308)
- Sends it in request (line 408)
- Doesn't reset on cancel (line 632)

**No changes needed** - frontend is working correctly.

## Error Handling

### Database Constraint Violation

If somehow a duplicate gets through (race condition), the database constraint will catch it:

```javascript
try {
  const result = await prisma.$transaction(async (tx) => {
    // ... create order
  });
} catch (error) {
  // Check if it's a unique constraint violation
  if (error.code === 'P2002' && error.meta?.target?.includes('clientRequestId')) {
    console.log('[Orders/take] ⚠️ Database constraint caught duplicate:', clientRequestId);
    
    // Fetch the existing order
    const existing = await prisma.order.findFirst({
      where: { userId, clientRequestId }
    });
    
    if (existing) {
      return res.json({
        success: true,
        data: buildOrderResponse(existing, user, currentDailyEarnings)
      });
    }
  }
  
  // Re-throw if it's a different error
  throw error;
}
```

## Logging Strategy

### Log Levels

**INFO (always log):**
- Order creation started: userId, productId, clientRequestId
- Duplicate detected: method (key/time), clientRequestId, existing order ID
- Order created successfully: order ID, clientRequestId

**ERROR (always log):**
- Database constraint violation
- Transaction failures
- Missing required data

**Example Logs:**
```
[Orders/take] userId from token: clx123abc
[Orders/take] Idempotency key: 1737158400000-abc123xyz
[Orders/take] ✅ Duplicate detected via idempotency key: 1737158400000-abc123xyz
[Orders/take] Returning existing order: clx456def
```

## Performance Considerations

### Query Optimization

1. **Idempotency key lookup:**
   - Uses existing unique index on `(userId, clientRequestId)`
   - O(log n) lookup time
   - Fast even with millions of orders

2. **Time-window lookup:**
   - New composite index on `(userId, productId, orderDate)`
   - Filters by userId first (most selective)
   - Then productId
   - Then orderDate range
   - O(log n) lookup time

3. **Impact:**
   - Two additional SELECT queries before transaction
   - Each query: ~1-5ms with proper indexes
   - Total overhead: ~10ms
   - Acceptable for preventing duplicates

### Concurrency

**Scenario:** Two requests with same idempotency key arrive simultaneously

**Flow:**
```
Request A: Check duplicate → Not found → Start transaction → Create order → Commit
Request B: Check duplicate → Not found → Start transaction → Create order → CONSTRAINT VIOLATION
```

**Result:** Request B catches the duplicate via database constraint and returns existing order.

## Migration Plan

### Step 1: Add Database Index
```bash
# Generate migration
npx prisma migrate dev --name add_order_duplicate_prevention_index

# This creates migration file with:
CREATE INDEX `Order_userId_productId_orderDate_idx` 
ON `order`(`userId`, `productId`, `orderDate`);
```

### Step 2: Update Backend Code
- Modify `backend/routes/orders.js`
- Move duplicate checks before transaction
- Fix idempotency key storage
- Add logging
- Add constraint violation handling

### Step 3: Test
- Test with rapid clicking (frontend)
- Test with concurrent API calls (Postman/curl)
- Verify logs show duplicate detection
- Verify database has no duplicates

### Step 4: Monitor
- Check logs for duplicate detection frequency
- Monitor database constraint violations (should be rare)
- Verify no performance degradation

## Testing Strategy

### Unit Tests (Manual Testing)

1. **Test: Idempotency key prevents duplicate**
   - Send same idempotency key twice
   - Verify second request returns existing order
   - Verify only one order in database

2. **Test: Time window prevents duplicate**
   - Send order for product X
   - Send order for product X again within 5 minutes (different key)
   - Verify second request returns existing order
   - Verify only one order in database

3. **Test: Different products allowed**
   - Send order for product X
   - Send order for product Y immediately
   - Verify both orders created

4. **Test: Same product after 5 minutes allowed**
   - Send order for product X
   - Wait 6 minutes
   - Send order for product X again
   - Verify both orders created

5. **Test: Concurrent requests**
   - Send 10 requests with same key simultaneously
   - Verify only one order created
   - Verify all requests return success with same order

### Load Testing

```bash
# Test concurrent requests with same idempotency key
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/orders/take \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-idempotency-key: test-key-123" \
    -H "Content-Type: application/json" \
    -d '{"product": {...}}' &
done
wait

# Verify only 1 order created
```

## Rollback Plan

If issues occur:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Keep database index:**
   - Index doesn't hurt, only helps performance
   - No need to remove

3. **Monitor for issues:**
   - Check error logs
   - Verify orders are being created
   - Check for user complaints

## Success Criteria

✅ **Functional:**
- Duplicate orders prevented via idempotency key
- Duplicate orders prevented via time window
- Concurrent requests handled correctly
- Existing orders returned with correct data

✅ **Performance:**
- Order creation time < 200ms (including duplicate checks)
- No database deadlocks
- No transaction timeouts

✅ **Observability:**
- Duplicate detection logged clearly
- Constraint violations logged
- Easy to debug issues

✅ **User Experience:**
- No duplicate orders in user's history
- No duplicate charges to balance
- Fast response times

## Future Enhancements

1. **Idempotency key expiration:**
   - Clean up old keys after 24 hours
   - Reduce database size

2. **Rate limiting:**
   - Limit orders per user per minute
   - Prevent abuse

3. **Analytics:**
   - Track duplicate detection rate
   - Identify users with high duplicate attempts
   - Optimize time window based on data

## References

- Requirements: `.kiro/specs/order-duplicate-prevention/requirements.md`
- Investigation: `DUPLICATE_ORDER_INVESTIGATION.md`
- Previous fix: `DUPLICATE_ORDER_FIX.md`
- Schema: `backend/prisma/schema.prisma`
- Order endpoint: `backend/routes/orders.js`
- Frontend: `frontend/src/components/OrdersPage.tsx`
