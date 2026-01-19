# USDT Wallet Management Feature

## Overview
Added USDT wallet address management feature, allowing users to save and manage their USDT wallet addresses for withdrawals. Similar to bank card management, users can add multiple wallets and set a default one.

## Implementation Summary

### 1. Database Changes
- **New Table**: `usdtwallet`
  - `id`: Primary key
  - `userId`: Foreign key to user
  - `walletAddress`: USDT wallet address
  - `walletName`: User-friendly name for the wallet
  - `network`: Network type (TRC20 or ERC20)
  - `isDefault`: Boolean flag for default wallet
  - `createdAt`, `updatedAt`: Timestamps

- **Migration**: `backend/migrations/add_usdt_wallets.sql`
- **Schema Update**: Added `UsdtWallet` model to `backend/prisma/schema.prisma`

### 2. Backend API
**File**: `backend/routes/usdt-wallets.js`

**Endpoints**:
- `GET /api/usdt-wallets` - Get user's USDT wallets
- `POST /api/usdt-wallets` - Add new USDT wallet
  - Validates wallet address format:
    - TRC20: 34 characters, starts with 'T'
    - ERC20: 42 characters, starts with '0x'
  - Prevents duplicate addresses
  - Auto-sets first wallet as default
- `PUT /api/usdt-wallets/:id/default` - Set wallet as default
- `DELETE /api/usdt-wallets/:id` - Delete wallet
  - Auto-promotes another wallet to default if deleted wallet was default

**Validation**:
- TRC20 address: `/^T[A-Za-z0-9]{33}$/`
- ERC20 address: `/^0x[a-fA-F0-9]{40}$/`

### 3. Frontend Components
**File**: `frontend/src/components/USDTWalletPage.tsx`

**Features**:
- Display list of saved USDT wallets
- Add new wallet form with:
  - Wallet name input
  - Network selection (TRC20/ERC20)
  - Wallet address input with format hints
- Wallet cards showing:
  - Wallet name
  - Masked address (first 6 + last 4 characters)
  - Network type
  - Default badge
  - Set default button
  - Delete button
- Toast notifications for success/error feedback
- Empty state when no wallets exist
- Animated transitions using Framer Motion

**Design**:
- Purple gradient cards (similar to bank cards but different color)
- Responsive layout
- Form validation
- Loading states

### 4. Navigation Integration
**File**: `frontend/src/components/MyPage.tsx`

- Added "USDT Wallets" menu item
- Lazy-loaded component for performance
- Integrated with existing navigation system

### 5. API Service
**File**: `frontend/src/services/api.ts`

**New Methods**:
- `getUsdtWallets()` - Fetch user's wallets
- `addUsdtWallet()` - Add new wallet
- `setDefaultUsdtWallet()` - Set default wallet
- `deleteUsdtWallet()` - Delete wallet

## Usage Flow

1. User navigates to "My" page
2. Clicks "USDT Wallets" menu item
3. Can add new wallet by:
   - Clicking "Add New Wallet"
   - Entering wallet name
   - Selecting network (TRC20/ERC20)
   - Entering wallet address
   - Submitting form
4. Saved wallets are displayed as cards
5. User can:
   - Set any wallet as default
   - Delete wallets
   - View masked addresses for security

## Next Steps (Future Enhancement)

### Integration with Withdrawal Flow
The withdrawal page should be updated to:
1. Add a dropdown to select from saved USDT wallets
2. Show "Add new wallet" option in dropdown
3. Pre-fill wallet address when user selects from saved wallets
4. Link to USDT Wallets page for management

**Suggested Implementation**:
```typescript
// In WithdrawalPage.tsx
const [savedWallets, setSavedWallets] = useState([]);
const [selectedWalletId, setSelectedWalletId] = useState('');

// Fetch saved wallets on mount
useEffect(() => {
  api.getUsdtWallets().then(res => {
    setSavedWallets(res?.data?.usdtWallets || []);
    // Auto-select default wallet
    const defaultWallet = res?.data?.usdtWallets?.find(w => w.isDefault);
    if (defaultWallet) {
      setSelectedWalletId(defaultWallet.id);
      setWalletAddress(defaultWallet.walletAddress);
      setNetwork(defaultWallet.network);
    }
  });
}, []);

// Dropdown for wallet selection
<select onChange={(e) => {
  const wallet = savedWallets.find(w => w.id === e.target.value);
  if (wallet) {
    setWalletAddress(wallet.walletAddress);
    setNetwork(wallet.network);
  }
}}>
  <option value="">Select saved wallet...</option>
  {savedWallets.map(w => (
    <option key={w.id} value={w.id}>
      {w.walletName} ({w.network})
    </option>
  ))}
  <option value="new">+ Add new wallet</option>
</select>
```

## Files Modified/Created

### Created:
- `backend/routes/usdt-wallets.js`
- `backend/migrations/add_usdt_wallets.sql`
- `frontend/src/components/USDTWalletPage.tsx`
- `run-usdt-migration.js` (migration runner)
- `USDT_WALLET_FEATURE.md` (this file)

### Modified:
- `backend/prisma/schema.prisma` - Added UsdtWallet model
- `backend/server.js` - Registered USDT wallet routes
- `frontend/src/services/api.ts` - Added USDT wallet API methods
- `frontend/src/components/MyPage.tsx` - Added USDT Wallets navigation

## Testing

### Manual Testing Steps:
1. ✅ Run migration: `node run-usdt-migration.js`
2. ✅ Generate Prisma client: `cd backend && npx prisma generate`
3. ✅ Verify model works: Test query successful
4. Start backend: `cd backend && npm start`
5. Start frontend: `cd frontend && npm start`
6. Test user flow:
   - Login as user
   - Navigate to My > USDT Wallets
   - Add TRC20 wallet
   - Add ERC20 wallet
   - Set default wallet
   - Delete wallet
   - Verify validation errors for invalid addresses

### API Testing:
```bash
# Get wallets
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/usdt-wallets

# Add wallet
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"walletAddress":"TXYZabc123...", "walletName":"My Wallet", "network":"TRC20"}' \
  http://localhost:5000/api/usdt-wallets

# Set default
curl -X PUT -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/usdt-wallets/<id>/default

# Delete
curl -X DELETE -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/usdt-wallets/<id>
```

## Security Considerations

1. **Address Validation**: Strict regex validation for both TRC20 and ERC20 addresses
2. **User Isolation**: All queries filtered by `userId` from JWT token
3. **Duplicate Prevention**: Checks for existing addresses before adding
4. **Cascade Delete**: Wallets are deleted when user is deleted (ON DELETE CASCADE)
5. **Address Masking**: Frontend displays masked addresses for privacy

## Performance

- Database indexes on `userId` for fast queries
- Frontend uses lazy loading for the page component
- API responses cached appropriately
- Optimistic UI updates for better UX

## Conclusion

The USDT Wallet management feature is now fully implemented and ready for use. Users can manage their USDT wallet addresses similar to how they manage bank cards. The next step is to integrate this with the withdrawal flow to allow users to select from saved wallets when making withdrawals.
