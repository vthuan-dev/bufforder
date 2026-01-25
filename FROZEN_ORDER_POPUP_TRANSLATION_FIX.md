# Frozen Order Popup Translation Fix

## Issue
When a frozen account clicked "Purchase Order", the popup showed raw translation keys instead of translated text:
- Showing `frozen.accountFrozenTitle` instead of "Tài khoản bị đóng băng"
- Showing `frozen.accountFrozenDetail` instead of the detailed Vietnamese message
- Showing `confirmation.close` instead of "Đóng"
- Showing `frozen.accountLocked` instead of "Tài khoản bị khóa"

## Root Cause
The English translation file (`frontend/src/i18n/locales/en/orders.json`) was missing the new translation keys that were added to the Vietnamese file. When i18next couldn't find the keys in the fallback language (English), it displayed the raw key names instead.

## Solution
Added missing translation keys to both English and Vietnamese translation files:

### Added to `confirmation` section:
- `close`: "Close" / "Đóng"

### Added to `frozen` section:
- `accountFrozenTitle`: "Account Frozen" / "Tài khoản bị đóng băng"
- `accountFrozenDetail`: Detailed message with interpolation for price, balance, and needed amount
- `cannotOrderWhileFrozen`: "Cannot place order while account is frozen" / "Không thể đặt hàng khi tài khoản bị đóng băng"
- `pleaseTopUpFirst`: "Please top up to unlock your account before placing orders." / "Vui lòng nạp tiền để mở khóa tài khoản trước khi đặt hàng."
- `accountLocked`: "Account Locked" / "Tài khoản bị khóa"

## Files Modified
1. `frontend/src/i18n/locales/en/orders.json` - Added missing translation keys
2. `frontend/src/i18n/locales/vi/orders.json` - Verified all keys exist

## Translation Key Usage in Code
The translations are used in `frontend/src/components/OrdersPage.tsx`:

1. **Toast notification** (line ~310):
   ```typescript
   toast.error(t('orders:frozen.accountFrozenTitle'), {
     description: t('orders:frozen.accountFrozenDetail', {
       price: suspendedOrder.productPrice.toFixed(2),
       balance: frozenBalance.toFixed(2),
       needed: (suspendedOrder.productPrice - frozenBalance).toFixed(2)
     })
   })
   ```

2. **Freeze warning box** (line ~1244):
   ```typescript
   {t('orders:frozen.accountFrozenDetail', {
     price: selectedProduct.price.toFixed(2),
     balance: frozenBalance.toFixed(2),
     needed: (selectedProduct.price - frozenBalance).toFixed(2)
   })}
   ```

3. **Button text** (line ~1268):
   ```typescript
   {isFrozen ? t('orders:confirmation.close') : t('orders:confirmation.later')}
   ```

4. **Disabled button** (line ~1280):
   ```typescript
   {isFrozen ? (
     <>
       <Lock className="w-4 h-4" />
       {t('orders:frozen.accountLocked')}
     </>
   ) : ...}
   ```

## Verification
- ✅ Both JSON files are valid
- ✅ All required keys exist in both English and Vietnamese
- ✅ Interpolation parameters are correctly formatted with `${{variable}}` syntax
- ✅ Keys match exactly between code usage and JSON files

## Testing
To test the fix:
1. Create a frozen account (balance insufficient for suspended order)
2. Click "Purchase Order" button
3. Verify popup shows:
   - Suspended product details
   - Red warning box with Vietnamese text explaining freeze reason
   - "Đóng" button instead of "Để sau"
   - Disabled confirm button with "Tài khoản bị khóa" text
4. Verify toast notification shows Vietnamese text with correct price/balance values

## Next Steps
The translations should now work correctly. If the issue persists:
1. Clear browser cache and reload
2. Check browser console for i18next errors
3. Verify the correct language is selected in localStorage
4. Check that i18next is properly initialized in `frontend/src/i18n/index.ts`
