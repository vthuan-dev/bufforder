# Tasks: Order Duplicate Prevention Implementation

## Task 1: Add Database Index for Time-Window Queries

**Priority:** HIGH  
**Estimated Time:** 5 minutes  
**Dependencies:** None

### Description
Add composite index on `(userId, productId, orderDate)` to optimize time-window duplicate detection queries.

### Steps

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   model Order {
     // ... existing fields
     
     @@unique([userId, clientRequestId], map: "Order_userId_clientRequestId_key")
     @@index([userId, orderDate], map: "Order_userId_orderDate_idx")
     @@index([userId, productId, orderDate], map: "Order_userId_productId_orderDate_idx") // ADD THIS
     @@map("order")
   }
   ```

2. Generate and apply migration:
   ```bash
   npx prisma migrate dev --name add_order_duplicate_prevention_index
   ```

3. Verify migration applied:
   ```bash
   npx prisma migrate status
   ```

### Acceptance Criteria
- [ ] Index added to schema
- [ ] Migration file created
- [ ] Migration applied to database
- [ ] No errors in migration

---

## Task 2: Refactor Order Creation - Move Duplicate Checks Before Transaction

**Priority:** CRITICAL  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 1

### Description
Move duplicate detection logic BEFORE the database transaction to prevent race conditions. Add comprehensive logging.

### Steps

1. **Add helper function** at top of `backend/routes/orders.js` (after imports):
   ```javascript
   // Helper to build consistent order response
   function buildOrderResponse(order, user, todayOrdersCount, dailyEarnings) {
     return {
       newCommission: user.commission,
       newBalance: user.balance,
       newCompletedToday: todayOrdersCount,
       newOrdersGrabbed: todayOrdersCount,
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

2. **Fix idempotency key extraction** in POST /api/orders/take:
   - Find line: `const clientRequestId = (req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').toString().trim() || null;`
   - Add logging after: `console.log('[Orders/take] Idempotency key:', clientRequestId);`

3. **Move idempotency key check BEFORE transaction:**
   - Find the section with `// Check idempotency key` (around line 119)
   - Move this ENTIRE block to BEFORE the `currentDailyEarnings` initialization
   - Update the return statement to use `buildOrderResponse()`:
     ```javascript
     if (clientRequestId) {
       const existingByKey = await prisma.order.findFirst({
         where: { userId, clientRequestId }
       });
       if (existingByKey) {
         console.log('[Orders/take] ✅ Duplicate detected via idempotency key:', clientRequestId);
         return res.json({
           success: true,
           data: buildOrderResponse(existingByKey, user, todayOrders.length, currentDailyEarnings)
         });
       }
     }
     ```

4. **Move time-window check BEFORE transaction:**
   - Find the section with `// Check for same product within last 5 minutes` (around line 135)
   - Move this ENTIRE block to AFTER the idempotency key check
   - Update the return statement to use `buildOrderResponse()`:
     ```javascript
     const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
     const existingByTime = await prisma.order.findFirst({
       where: {
         userId,
         productId: parseInt(randomProduct.id),
         orderDate: { gte: fiveMinutesAgo }
       }
     });
     
     if (existingByTime) {
       console.log('[Orders/take] ✅ Duplicate detected: same product within 5 minutes, productId:', randomProduct.id);
       return res.json({
         success: true,
         data: buildOrderResponse(existingByTime, user, todayOrders.length, currentDailyEarnings)
       });
     }
     ```

5. **Remove duplicate checks from inside transaction:**
   - Delete the idempotency key check inside `$transaction()`
   - Delete the time-window check inside `$transaction()`

6. **Fix clientRequestId storage in transaction:**
   - Find line: `clientRequestId: clientRequestId || undefined,`
   - Change to: `clientRequestId,` (remove the `|| undefined` part)

7. **Add success logging after transaction:**
   ```javascript
   console.log('[Orders/take] ✅ Order created successfully:', {
     orderId: result.newOrder.id,
     clientRequestId,
     productId: randomProduct.id
   });
   ```

### Acceptance Criteria
- [ ] Helper function `buildOrderResponse()` added
- [ ] Idempotency key check moved before transaction
- [ ] Time-window check moved before transaction
- [ ] Duplicate checks removed from inside transaction
- [ ] `clientRequestId` stored correctly (not undefined)
- [ ] Logging added for all cases
- [ ] Code compiles without errors

---

## Task 3: Add Database Constraint Violation Handling

**Priority:** HIGH  
**Estimated Time:** 15 minutes  
**Dependencies:** Task 2

### Description
Add try-catch around transaction to handle database constraint violations gracefully.

### Steps

1. **Wrap transaction in try-catch** in POST /api/orders/take:
   ```javascript
   try {
     // Create order and update user in transaction
     const result = await prisma.$transaction(async (tx) => {
       // ... existing transaction code
     });
     
     // ... existing success code (logging, socket emit, response)
     
   } catch (transactionError) {
     // Check if it's a unique constraint violation on clientRequestId
     if (transactionError.code === 'P2002' && 
         transactionError.meta?.target?.includes('clientRequestId')) {
       console.log('[Orders/take] ⚠️ Database constraint caught duplicate:', clientRequestId);
       
       // Fetch the existing order
       const existing = await prisma.order.findFirst({
         where: { userId, clientRequestId }
       });
       
       if (existing) {
         return res.json({
           success: true,
           data: buildOrderResponse(existing, user, todayOrders.length, currentDailyEarnings)
         });
       }
     }
     
     // Re-throw if it's a different error
     console.error('[Orders/take] ❌ Transaction error:', transactionError);
     throw transactionError;
   }
   ```

2. **Move existing catch block** to wrap the new try-catch:
   - The existing `catch (error)` at the end should wrap everything
   - Keep the existing error handling: `res.status(500).json({ success: false, message: 'Error taking order' })`

### Acceptance Criteria
- [ ] Transaction wrapped in try-catch
- [ ] Constraint violation detected and handled
- [ ] Existing order returned on constraint violation
- [ ] Other errors re-thrown and handled by outer catch
- [ ] Logging added for constraint violations

---

## Task 4: Test Duplicate Prevention

**Priority:** CRITICAL  
**Estimated Time:** 20 minutes  
**Dependencies:** Task 3

### Description
Manually test all duplicate prevention scenarios to verify the implementation works correctly.

### Steps

1. **Test 1: Idempotency key prevents duplicate**
   - Open browser DevTools → Network tab
   - Click "Submit" button on Orders page
   - Copy the `x-idempotency-key` from request headers
   - Use Postman/curl to send same request with same key
   - **Expected:** Second request returns existing order, no new order created
   - **Verify:** Check database - only 1 order exists

2. **Test 2: Time window prevents duplicate**
   - Click "Submit" button for a product
   - Wait 2 seconds
   - Click "Submit" button again (different idempotency key)
   - **Expected:** Second request returns existing order if same product
   - **Verify:** Check database - only 1 order exists

3. **Test 3: Different products allowed**
   - Click "Submit" button for product A
   - Immediately click "Submit" button for product B
   - **Expected:** Both orders created successfully
   - **Verify:** Check database - 2 orders exist

4. **Test 4: Same product after 5 minutes allowed**
   - Click "Submit" button for a product
   - Wait 6 minutes (or modify code to 10 seconds for testing)
   - Click "Submit" button for same product
   - **Expected:** Both orders created successfully
   - **Verify:** Check database - 2 orders exist

5. **Test 5: Rapid clicking (frontend protection)**
   - Click "Submit" button rapidly 10 times
   - **Expected:** Only 1 order created
   - **Verify:** Check browser console - should see "blocked" messages
   - **Verify:** Check database - only 1 order exists

6. **Test 6: Concurrent API requests (backend protection)**
   - Use script to send 10 concurrent requests with same idempotency key
   - **Expected:** Only 1 order created, all requests return success
   - **Verify:** Check server logs - should see duplicate detection or constraint violation
   - **Verify:** Check database - only 1 order exists

### Test Script for Concurrent Requests

Create `test-concurrent-orders.js`:
```javascript
const axios = require('axios');

async function testConcurrentOrders() {
  const token = 'YOUR_TOKEN_HERE'; // Get from browser DevTools
  const idempotencyKey = `test-${Date.now()}`;
  
  const requests = Array(10).fill(null).map(() => 
    axios.post('http://localhost:5000/api/orders/take', {
      product: {
        id: '241',
        name: 'iPhone 15 Pro Max',
        price: 1199,
        brand: 'Apple',
        category: 'Smartphones',
        image: 'https://example.com/iphone.jpg'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-idempotency-key': idempotencyKey,
        'Content-Type': 'application/json'
      }
    })
  );
  
  try {
    const results = await Promise.all(requests);
    console.log('All requests completed successfully');
    console.log('Order IDs:', results.map(r => r.data.data.order.id));
    
    // Check if all returned same order ID
    const uniqueIds = new Set(results.map(r => r.data.data.order.id));
    console.log('Unique order IDs:', uniqueIds.size);
    console.log('✅ Test passed:', uniqueIds.size === 1 ? 'YES' : 'NO');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testConcurrentOrders();
```

### Acceptance Criteria
- [ ] Test 1 passed: Idempotency key prevents duplicate
- [ ] Test 2 passed: Time window prevents duplicate
- [ ] Test 3 passed: Different products allowed
- [ ] Test 4 passed: Same product after 5 minutes allowed
- [ ] Test 5 passed: Rapid clicking prevented
- [ ] Test 6 passed: Concurrent requests handled correctly
- [ ] All tests logged correctly in server console
- [ ] No duplicate orders in database

---

## Task 5: Verify Logging and Monitoring

**Priority:** MEDIUM  
**Estimated Time:** 10 minutes  
**Dependencies:** Task 4

### Description
Verify that all duplicate detection events are logged correctly for debugging and monitoring.

### Steps

1. **Check server logs** during testing:
   - Look for `[Orders/take]` prefix
   - Verify idempotency key logged
   - Verify duplicate detection logged with method (key/time)
   - Verify order creation success logged

2. **Expected log patterns:**
   ```
   [Orders/take] userId from token: clx123abc
   [Orders/take] Idempotency key: 1737158400000-abc123xyz
   [Orders/take] ✅ Duplicate detected via idempotency key: 1737158400000-abc123xyz
   ```
   
   OR
   
   ```
   [Orders/take] userId from token: clx123abc
   [Orders/take] Idempotency key: 1737158400000-xyz789def
   [Orders/take] ✅ Duplicate detected: same product within 5 minutes, productId: 241
   ```
   
   OR
   
   ```
   [Orders/take] userId from token: clx123abc
   [Orders/take] Idempotency key: 1737158400000-new123abc
   [Orders/take] ✅ Order created successfully: { orderId: 'clx789ghi', clientRequestId: '1737158400000-new123abc', productId: '241' }
   ```

3. **Verify constraint violation logging** (if it occurs):
   ```
   [Orders/take] ⚠️ Database constraint caught duplicate: 1737158400000-abc123xyz
   ```

### Acceptance Criteria
- [ ] All duplicate detections logged clearly
- [ ] Idempotency keys logged for debugging
- [ ] Order creation success logged
- [ ] Constraint violations logged (if they occur)
- [ ] Logs are easy to read and understand

---

## Task 6: Update Documentation

**Priority:** LOW  
**Estimated Time:** 10 minutes  
**Dependencies:** Task 5

### Description
Update project documentation to reflect the duplicate prevention implementation.

### Steps

1. **Update `DUPLICATE_ORDER_FIX.md`:**
   - Add section "2025-01-18: Enhanced Duplicate Prevention"
   - Document the changes made
   - Include testing results
   - Add examples of log output

2. **Create summary in `DUPLICATE_ORDER_INVESTIGATION.md`:**
   - Add "Resolution" section
   - Summarize root causes found
   - Summarize fixes implemented
   - Include before/after comparison

### Acceptance Criteria
- [ ] Documentation updated
- [ ] Changes clearly described
- [ ] Testing results documented
- [ ] Examples included

---

## Summary

**Total Estimated Time:** ~90 minutes

**Task Order:**
1. Task 1: Add database index (5 min)
2. Task 2: Refactor duplicate checks (30 min)
3. Task 3: Add constraint handling (15 min)
4. Task 4: Test all scenarios (20 min)
5. Task 5: Verify logging (10 min)
6. Task 6: Update docs (10 min)

**Critical Path:** Tasks 1 → 2 → 3 → 4

**Success Metrics:**
- ✅ Zero duplicate orders in database after testing
- ✅ All 6 test scenarios pass
- ✅ Logs show clear duplicate detection
- ✅ No performance degradation
- ✅ User experience unchanged (except no duplicates!)
