# Admin Balance Update - Transaction History Fix

## Problem
When admin manually adds balance to a user account (via Edit User dialog), the balance increases correctly but the transaction doesn't appear in the user's "Lịch sử giao dịch" (Transaction History) page.

## Root Cause
- Transaction history page loads data from `DepositRequest` and `WithdrawalRequest` tables
- When admin updates user balance via `PUT /api/admin/users/:id`, it only updated the `balance` field in User table
- No `DepositRequest` record was created, so nothing appeared in transaction history

## Solution Implemented
Modified the `PUT /api/admin/users/:id` endpoint in `backend/routes/admin.js` to automatically create a `DepositRequest` record when admin increases user balance.

### Changes Made

**File: `backend/routes/admin.js`** (lines 661-710)

When admin increases user balance:
1. Calculate the balance difference (`balanceDelta`)
2. Update user's `balance` and `totalDeposited` fields
3. Create a `DepositRequest` record with:
   - `status = 'approved'` (pre-approved)
   - `approvedBy = adminId` (the admin who made the change)
   - `approvedAt = now()`
   - `notes = 'Manually added by admin'`
   - `requestDate = now()`
4. Use Prisma transaction to ensure both operations succeed or fail together

### Code Changes

```javascript
// Handle balance increase (treat as deposit)
let balanceDelta = 0;
if (balance !== undefined) {
  const newBalance = Number(balance);
  if (newBalance < currentUser.balance) {
    return res.status(400).json({ success: false, message: 'Balance decrease not allowed' });
  }
  balanceDelta = newBalance - currentUser.balance;
  if (balanceDelta > 0) {
    data.balance = newBalance;
    data.totalDeposited = currentUser.totalDeposited + balanceDelta;
    const newVipLevel = getVipLevelByAmount(data.totalDeposited);
    if (newVipLevel) data.vipLevel = newVipLevel.id;
  }
}

// Use transaction to update user and create deposit request if balance increased
let user;
if (balanceDelta > 0) {
  const result = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { addresses: true, bankCards: true }
    }),
    prisma.depositRequest.create({
      data: {
        userId: req.params.id,
        amount: balanceDelta,
        status: 'approved',
        approvedBy: req.adminId,
        approvedAt: new Date(),
        notes: 'Manually added by admin',
        requestDate: new Date()
      }
    })
  ]);
  user = result[0];
} else {
  user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    include: { addresses: true, bankCards: true }
  });
}
```

## Testing

Created test file: `test-admin-balance-update.js`

Test verifies:
1. ✅ Admin can update user balance
2. ✅ DepositRequest is created automatically
3. ✅ Transaction appears in database

### Test Results
```
🧪 Testing Admin Balance Update with Transaction History

1️⃣ Admin Login
   ✅ Login successful

2️⃣ Getting test user
   ✅ Test user: Nguyen B (ID: cmkjmj73a000o3a6913fypj9z)
   Current balance: $0
   Total deposited: $0

3️⃣ Checking existing deposit requests
   Existing deposit requests: 2

4️⃣ Updating user balance (+$5000)
   ✅ Balance updated successfully
   New balance: $5000
   New total deposited: $5000

5️⃣ Verifying deposit request was created
   Total deposit requests now: 3
   ✅ New deposit request created!
   - ID: cmkjs3l1200017jot6n9jmo0w
   - Amount: $5000
   - Status: approved
   - Notes: Manually added by admin

✅ Test completed successfully!
```

## How to Test Manually

1. **Start the application**:
   ```bash
   # Backend
   cd backend
   node server.js

   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

2. **Login as admin**:
   - Go to admin panel
   - Login with: `admin` / `admin1234`

3. **Edit a user's balance**:
   - Go to Users page
   - Click Edit on any user
   - Increase the balance (e.g., add $5000)
   - Save changes

4. **Verify transaction appears**:
   - Login as that user on the frontend
   - Go to "My" page → "Lịch sử giao dịch" (Transaction History)
   - You should see the deposit with:
     - Type: Deposit
     - Amount: $5000
     - Status: Approved
     - Date/Time: When admin made the change

## Benefits

1. **Complete audit trail**: All balance changes are now tracked in the database
2. **User transparency**: Users can see all deposits including admin-added ones
3. **Data consistency**: Uses database transactions to ensure data integrity
4. **No breaking changes**: Existing functionality remains unchanged

## Related Files

- `backend/routes/admin.js` - Main implementation
- `frontend/src/components/TransactionHistoryPage.tsx` - Displays transaction history
- `backend/prisma/schema.prisma` - DepositRequest model definition
- `test-admin-balance-update.js` - Automated test

## Date
January 18, 2026
