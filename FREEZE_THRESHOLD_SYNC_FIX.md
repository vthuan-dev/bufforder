# Freeze Threshold Sync Fix

## Problem
Admin set freeze threshold = 2, but the freeze order appeared at order #3 instead of order #2. The system was "skipping" one order before triggering the freeze mechanism.

## Root Cause
**State synchronization issue** between frontend and backend:

1. **Initial state**: User has 0 orders, threshold = 2
2. **Order #1**: 
   - User clicks "Take Order"
   - Frontend fetches fresh stats: `ordersReceived = 0`
   - Calculates `nextOrderNumber = 0 + 1 = 1`
   - Checks: `1 >= 2` = false → selects normal product
   - User confirms → `ordersReceived` becomes 1
3. **Order #2**:
   - User clicks "Take Order"
   - Frontend fetches fresh stats: `ordersReceived = 1`
   - **BUG**: Frontend updates `availableBalance` and `freezeThreshold` but NOT `ordersReceived` state
   - Uses OLD state value: `ordersReceived = 1` (from previous order)
   - Calculates `nextOrderNumber = 1 + 1 = 2`
   - Checks: `2 >= 2` = **true** → SHOULD select freeze product
   - **BUT** if state wasn't updated, it might use stale value
4. **Order #3**:
   - Finally triggers freeze because state caught up

## Code Analysis

### Before Fix
```typescript
try {
  const freshStats = await api.userOrderStats();
  if (freshStats.success) {
    freshOrdersReceived = Number(freshStats.data.ordersGrabbed || 0);
    freshBalance = Number(freshStats.data.balance || 0);
    freshFreezeThreshold = freshStats.data?.freezeThreshold || null;
    
    // ❌ BUG: Only update balance and freeze config
    setAvailableBalance(freshBalance);
    setFreezeThreshold(freshFreezeThreshold);
    // ordersReceived NOT updated! ← BUG
  }
}

// Later: uses freshOrdersReceived (from API) but state is stale
const currentCount = Number(freshOrdersReceived);
const nextOrderNumber = currentCount + 1;
```

### After Fix
```typescript
try {
  const freshStats = await api.userOrderStats();
  if (freshStats.success) {
    freshOrdersReceived = Number(freshStats.data.ordersGrabbed || 0);
    freshBalance = Number(freshStats.data.balance || 0);
    freshFreezeThreshold = freshStats.data?.freezeThreshold || null;
    
    // ✅ FIX: Update ALL state immediately
    setAvailableBalance(freshBalance);
    setFreezeThreshold(freshFreezeThreshold);
    setFreezeTargetProductId(freshFreezeTargetProductId);
    setOrdersReceived(freshOrdersReceived); // ← FIXED
    ordersReceivedRef.current = freshOrdersReceived; // ← FIXED
  }
}

// Now uses fresh, synced state
const currentCount = Number(freshOrdersReceived);
const nextOrderNumber = currentCount + 1;
```

## Solution
**Always sync ALL relevant state** when fetching fresh stats from API:
1. Update `availableBalance` ✅
2. Update `freezeThreshold` ✅
3. Update `freezeTargetProductId` ✅
4. Update `ordersReceived` ✅ (NEW)
5. Update `ordersReceivedRef` ✅ (NEW)

This ensures that:
- Frontend state is always in sync with backend
- Freeze threshold check uses accurate order count
- No "off-by-one" errors in freeze triggering

## Testing Scenario
1. Admin sets freeze threshold = 2 for a user
2. User takes order #1 → normal product (affordable)
3. User takes order #2 → **freeze product** (price > balance) ← Should trigger here
4. Account gets frozen after order #2

Expected behavior:
- Threshold = 2 → freeze at order #2
- Threshold = 3 → freeze at order #3
- Threshold = 1 → freeze at order #1

## Files Changed
- `frontend/src/components/OrdersPage.tsx`: Update ordersReceived state when fetching fresh stats

## Additional Notes
- This fix also ensures that the UI displays accurate order counts
- The `ordersReceivedRef` is updated to prevent the `safeSetOrdersReceived` function from blocking the update
- API is the single source of truth for all order-related data
