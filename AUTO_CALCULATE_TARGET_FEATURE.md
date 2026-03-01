# Auto-Calculate Daily Target Feature (Reverse Calculation)

## Overview
Added a reverse calculation feature: when admin enters a target amount, the system automatically calculates the required average product price to achieve that target with the specified number of orders.

## Problem Solved
Admin wants to set a target of $270 for 60 orders, but with VIP 1 commission rate (0.45%) and average product price of $2,500, the actual earnings would be $675 - way too high.

**Solution**: Calculate backwards to find the required average product price.

## How It Works

### Scenario 1: Enter Orders + Target → Get Required Price
**Input:**
- Number of orders: 60
- Daily target: $270
- VIP level: VIP 1 (0.45% commission)

**Output:**
- Required average product price: **$1,000**
- Message: "With 60 orders at avg $1,000, user will earn $270"

**Calculation:**
```
Required Price = Target / (Orders × Commission Rate)
Required Price = $270 / (60 × 0.0045)
Required Price = $270 / 0.27
Required Price = $1,000
```

### Scenario 2: Enter Orders Only → Get Suggested Target
**Input:**
- Number of orders: 60
- VIP level: VIP 1 (0.45%)

**Output:**
- Suggested target: **$675**
- Based on default average price of $2,500

**Calculation:**
```
Suggested Target = Orders × Avg Price × Commission Rate
Suggested Target = 60 × $2,500 × 0.0045
Suggested Target = $675
```

## Implementation

### 1. Reverse Calculation Logic
```typescript
useEffect(() => {
  if (!selectedUser || !commissionNumberOfOrders) return;
  
  const orders = Number(commissionNumberOfOrders);
  const commissionRate = VIP_COMMISSION_RATES[selectedUser.vipLevel] || 0;
  
  if (commissionDailyTarget && Number(commissionDailyTarget) > 0) {
    // REVERSE: Calculate required average price
    const target = Number(commissionDailyTarget);
    const requiredAvgPrice = target / (orders * commissionRate);
    setSuggestedTarget(requiredAvgPrice);
  } else {
    // FORWARD: Suggest target based on $2,500 average
    const calculated = orders * 2500 * commissionRate;
    setSuggestedTarget(calculated);
  }
}, [commissionNumberOfOrders, commissionDailyTarget, selectedUser]);
```

### 2. UI Display
Two states:

**When target is entered:**
```
💡 Required Avg Product Price: $1,000
With 60 orders at avg $1,000, user will earn $270
```

**When only orders entered:**
```
💡 Suggested target: $675
```

### 3. Files Modified

#### Frontend
- `frontend/src/components/admin/AdminUsersPage.tsx`
  - Changed calculation logic to reverse mode
  - Updated UI to show required price instead of warning
  - Removed auto-calculate button (now automatic)

#### Translations
- `frontend/src/i18n/locales/en/adminUsers.json`
  - Added: `requiredAvgPrice`, `priceHint`
  - Removed: `autoCalculate`, `suggestedTarget`, `targetRealistic`
  
- `frontend/src/i18n/locales/vi/adminUsers.json`
  - Added: `requiredAvgPrice`, `priceHint`
  - Removed: `autoCalculate`, `suggestedTarget`, `targetRealistic`

## Usage Examples

### Example 1: VIP 1 wants $270 from 60 orders
- Input: 60 orders, $270 target
- System shows: "Required Avg Product Price: $1,000"
- Meaning: Admin needs to ensure products average $1,000 each

### Example 2: VIP 2 wants $400 from 100 orders
- VIP 2 commission: 0.54%
- Required price: $400 / (100 × 0.0054) = **$741**
- System shows: "With 100 orders at avg $741, user will earn $400"

### Example 3: VIP 5 wants $1,500 from 180 orders
- VIP 5 commission: 1.08%
- Required price: $1,500 / (180 × 0.0108) = **$772**
- System shows: "With 180 orders at avg $772, user will earn $1,500"

## Benefits
1. **Realistic Planning**: Admin knows exactly what product price range to use
2. **Flexible Targets**: Can set any target and see what's needed
3. **Automatic**: No button clicking, updates in real-time
4. **Clear Guidance**: Shows exact price needed to hit target
5. **Works Both Ways**: Can calculate target OR required price

## Technical Notes
- Calculation updates in real-time as user types
- Handles both forward (orders → target) and reverse (target → price) calculations
- Commission rates include 10% deduction (already multiplied by 0.9)
- All values rounded to 2 decimal places
- Works for all VIP levels automatically

## Testing
Build successful with no errors:
```bash
npm run build
✓ built in 6.00s
```

## Next Steps
1. Deploy to Vercel
2. Test with real scenarios
3. Admin can now set realistic targets and know what product prices to use
