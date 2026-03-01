# Target Price Auto-Filter Feature

## Overview
Implemented automatic product price filtering based on admin-set commission targets. When admin sets a target (e.g., 100 orders → $1,000), the system automatically calculates the required product price and filters products to match that price range.

## Problem Solved
Admin wants user to earn exactly the target amount with the specified number of orders:
- Admin sets: 100 orders, $1,000 target
- User VIP 1 (0.45% commission)
- System needs to ensure user gets products priced to earn exactly $1,000

## How It Works

### Flow:
1. **Admin sets target** → Frontend calculates required price → Saves to database
2. **User requests products** → Backend filters by price range → User only sees matching products
3. **User completes orders** → Earns exactly the target amount ✓

### Example:
**Admin Input:**
- Number of orders: 100
- Daily target: $1,000
- User: VIP 1 (0.45% commission)

**System Calculation:**
```
Required Price = Target / (Orders × Commission Rate)
Required Price = $1,000 / (100 × 0.0045)
Required Price = $1,000 / 0.45
Required Price = $2,222
```

**Backend Filter:**
- Min price: $2,222 × 0.85 = $1,889 (-15%)
- Max price: $2,222 × 1.15 = $2,555 (+15%)
- User only sees products in $1,889-$2,555 range

**Result:**
- User completes 100 orders
- Average price: ~$2,222
- Commission earned: 100 × $2,222 × 0.45% = **$1,000** ✓

## Implementation

### 1. Frontend Changes

#### AdminUsersPage.tsx
Added automatic calculation and saving of `targetProductPrice`:

```typescript
// Calculate target product price when saving
let targetProductPrice = null;
if (commissionNumberOfOrders && commissionDailyTarget && selectedUser) {
  const orders = Number(commissionNumberOfOrders);
  const target = Number(commissionDailyTarget);
  const commissionRate = VIP_COMMISSION_RATES[selectedUser.vipLevel] || 0;
  
  if (orders > 0 && target > 0 && commissionRate > 0) {
    targetProductPrice = target / (orders * commissionRate);
  }
}

// Save to backend
await api.adminUpdateUserCommissionConfig(selectedUser.id, {
  perOrderAmount: ...,
  dailyTarget: ...,
  numberOfOrders: ...,
  targetProductPrice: targetProductPrice // NEW
});
```

### 2. Backend Changes

#### routes/products.js
Added authentication and price filtering:

```javascript
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.userId;
  
  // Get user's target product price from commissionConfig
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { commissionConfig: true }
  });
  
  const commissionConfig = parseJsonField(user?.commissionConfig, {});
  const targetProductPrice = commissionConfig.targetProductPrice;
  
  let whereClause = { isActive: true };
  
  // Filter products within ±15% of target price
  if (targetProductPrice && targetProductPrice > 0) {
    const minPrice = targetProductPrice * 0.85;
    const maxPrice = targetProductPrice * 1.15;
    
    whereClause.price = {
      gte: minPrice,
      lte: maxPrice
    };
  }
  
  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { id: 'asc' }
  });
  
  res.json({ success: true, data: products });
});
```

## Files Modified

### Frontend
- `frontend/src/components/admin/AdminUsersPage.tsx`
  - Added `targetProductPrice` calculation in `handleSave`
  - Sends calculated price to backend

### Backend
- `backend/routes/products.js`
  - Added `authenticateToken` middleware
  - Added price range filtering (±15%)
  - Added logging for debugging

## Usage Examples

### Example 1: VIP 1 - 60 orders, $270 target
- Required price: $270 / (60 × 0.0045) = **$1,000**
- Filter range: $850 - $1,150
- User sees only products in this range

### Example 2: VIP 2 - 100 orders, $1,000 target
- VIP 2 commission: 0.54%
- Required price: $1,000 / (100 × 0.0054) = **$1,852**
- Filter range: $1,574 - $2,130

### Example 3: VIP 5 - 180 orders, $1,500 target
- VIP 5 commission: 1.08%
- Required price: $1,500 / (180 × 0.0108) = **$772**
- Filter range: $656 - $888

## Price Range Logic

**Why ±15%?**
- Allows some variation in product selection
- Prevents too narrow filtering (no products found)
- Still keeps earnings close to target
- Can be adjusted if needed

**Example with ±15%:**
- Target price: $1,000
- Min: $850 (-15%)
- Max: $1,150 (+15%)
- If user gets mix of products in this range, average will be ~$1,000

## Benefits

1. **Automatic**: No manual product selection needed
2. **Accurate**: User earns exactly (or very close to) target amount
3. **Flexible**: Works for all VIP levels automatically
4. **Transparent**: Admin sees required price in UI
5. **Scalable**: Handles any target/order combination

## Technical Notes

- Price calculation: `target / (orders × commissionRate)`
- Filter range: ±15% of calculated price
- Stored in `commissionConfig.targetProductPrice`
- Applied per-user (different users can have different filters)
- Falls back to all products if no target price set
- Requires authentication (user-specific filtering)

## Testing

Build successful:
```bash
npm run build
✓ built in 6.70s
```

## Deployment Steps

1. **Deploy Frontend** to Vercel (already built)
2. **Deploy Backend** to VPS:
   ```bash
   cd /var/www/greeting-message/backend
   git pull
   pm2 restart greeting-backend
   ```
3. **Test**:
   - Admin: Set 100 orders, $1,000 target for a VIP 1 user
   - User: Login and check products (should see ~$2,222 range)
   - User: Complete orders and verify earnings

## Database Schema

No migration needed! Uses existing `commissionConfig` JSON field:
```json
{
  "perOrderAmount": null,
  "dailyTarget": 1000,
  "numberOfOrders": 100,
  "targetProductPrice": 2222.22  // NEW field
}
```

## Future Enhancements

1. Make ±15% range configurable by admin
2. Add UI to show filtered price range to user
3. Add analytics to track target vs actual earnings
4. Add warning if not enough products in price range
