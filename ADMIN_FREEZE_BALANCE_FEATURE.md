# Admin Freeze Balance Feature

## Overview
Admin can now manually freeze any user's account and balance at any time through the Users Management page.

## Implementation

### Backend (backend/routes/admin.js)
- **New Endpoint**: `POST /api/admin/users/:id/freeze`
  - Freezes user account
  - Moves current balance to `frozenBalance`
  - Sets `balance` to 0
  - Records freeze timestamp and reason
  - Sends notification to user
  - Emits real-time socket event `account:frozen`

### Frontend

#### API Service (frontend/src/services/api.ts)
- **New Method**: `adminFreezeUser(userId, reason?)`
  - Calls freeze endpoint with optional reason

#### Admin Users Page (frontend/src/components/admin/AdminUsersPage.tsx)
- **New Action**: "Freeze Balance" button in dropdown menu
  - Shows for non-frozen users (orange color)
  - Prompts admin for freeze reason (optional)
  - Confirms action before executing
  - Reloads user list after success
- **Existing**: "Unlock Account" button
  - Shows for frozen users (green color)

#### i18n Translations
**English** (frontend/src/i18n/locales/en/adminUsers.json):
- `actions.freeze`: "Freeze Balance"
- `notifications.freezeConfirm`: "Are you sure you want to freeze {{name}}'s account and balance?"
- `notifications.freezeReasonPrompt`: "Enter reason for freezing (optional):"
- `notifications.userFrozen`: "Account frozen successfully! Balance has been moved to frozen balance."
- `notifications.freezeFailed`: "Failed to freeze account"

**Vietnamese** (frontend/src/i18n/locales/vi/adminUsers.json):
- `actions.freeze`: "Đóng băng số dư"
- `notifications.freezeConfirm`: "Bạn có chắc chắn muốn đóng băng tài khoản và số dư của {{name}}?"
- `notifications.freezeReasonPrompt`: "Nhập lý do đóng băng (tùy chọn):"
- `notifications.userFrozen`: "Đóng băng tài khoản thành công! Số dư đã được chuyển sang số dư đóng băng."
- `notifications.freezeFailed`: "Đóng băng tài khoản thất bại"

## User Experience

### Admin Flow
1. Navigate to Admin → Users
2. Click "..." menu on any active user
3. Click "Freeze Balance" (orange)
4. Enter optional reason in prompt
5. Confirm freeze action
6. User account is frozen immediately
7. User list refreshes to show frozen status

### User Impact
- Account marked as frozen (`isFrozen = true`)
- Balance moved to `frozenBalance`
- Current balance set to $0
- User receives notification about freeze
- User sees freeze warning on Orders page and My page
- User can still create TopUp requests
- Admin can unlock account anytime to restore balance

## Database Changes
Uses existing freeze fields from account freeze mechanism:
- `isFrozen` (Boolean)
- `frozenBalance` (Decimal)
- `frozenAt` (DateTime)
- `frozenReason` (String)
- `unfrozenAt` (DateTime)
- `unfrozenBy` (String - admin ID)

## Testing
1. Login as admin
2. Go to Users page
3. Find an active user with balance
4. Click "Freeze Balance"
5. Enter reason (optional)
6. Confirm
7. Verify user shows "Frozen" badge
8. Login as that user
9. Verify freeze warning appears
10. Verify balance is $0 and frozen balance shows correct amount
11. As admin, click "Unlock Account"
12. Verify balance is restored

## Notes
- Freeze can be applied to any user regardless of VIP level
- Frozen users can still receive deposits (which auto-unlock)
- Admin can unlock manually at any time
- Real-time notifications keep user informed
- Freeze reason is optional but recommended for record-keeping
