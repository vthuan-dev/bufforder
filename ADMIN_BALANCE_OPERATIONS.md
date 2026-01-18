# Admin Balance Operations - Set/Subtract Feature

## Overview
Admin can now SET balance to a specific value or SUBTRACT from balance, not just ADD.

## Changes Made

### Frontend (`frontend/src/components/admin/AdminUsersPage.tsx`)

1. **Added Operation Selector**
   - Dropdown to select operation type: Add / Set / Subtract
   - Dynamic placeholder text based on selected operation
   - Preview of new balance before confirming

2. **Updated `handleAddBalance` Function**
   - Now supports three operations:
     * **Add**: `newBalance = currentBalance + amount`
     * **Set**: `newBalance = amount`
     * **Subtract**: `newBalance = max(0, currentBalance - amount)` (prevents negative)
   - Resets operation to 'add' after each change
   - Shows appropriate success message for each operation

3. **UI Improvements**
   - Operation selector dropdown above amount input
   - Dynamic button text (Add/Set/Subtract)
   - Real-time preview of new balance
   - Prevents negative balance on subtract

### Backend (`backend/routes/admin.js`)

1. **Removed Balance Decrease Restriction**
   - Previously blocked balance decreases
   - Now allows all balance changes (add/set/subtract)

2. **Smart Balance Change Detection**
   - Automatically detects operation type:
     * `add`: newBalance > currentBalance
     * `subtract`: newBalance < currentBalance
     * `none`: no change

3. **Proper Handling by Operation Type**
   - **Add**: Creates deposit request, updates totalDeposited, may upgrade VIP level
   - **Subtract**: Creates notification only, doesn't affect totalDeposited or VIP level
   - **Set**: Updates balance directly, doesn't affect totalDeposited or VIP level

4. **Real-time Notifications**
   - Add: "Admin has added X to your account" (success)
   - Subtract: "Admin has deducted X from your account" (info)
   - Socket.io emits balance updates to client

## Usage

1. Admin opens user edit dialog
2. Clicks the "+" button next to balance field
3. Selects operation type from dropdown:
   - **Add to Balance**: Increase balance (e.g., 2000 → 2500)
   - **Set Balance**: Set to specific value (e.g., 2000 → 1000)
   - **Subtract from Balance**: Decrease balance (e.g., 2000 → 1500)
4. Enters amount
5. Previews new balance
6. Clicks Add/Set/Subtract button
7. Clicks "Save Changes" to apply

## Example Scenarios

### Scenario 1: Set Balance to 1000
- Current: $2000
- Operation: Set Balance
- Amount: 1000
- Result: $1000
- VIP Level: Unchanged
- totalDeposited: Unchanged

### Scenario 2: Subtract 500
- Current: $2000
- Operation: Subtract from Balance
- Amount: 500
- Result: $1500
- VIP Level: Unchanged
- totalDeposited: Unchanged

### Scenario 3: Add 500
- Current: $2000
- Operation: Add to Balance
- Amount: 500
- Result: $2500
- VIP Level: May upgrade if totalDeposited threshold reached
- totalDeposited: Increased by 500

## Safety Features

- Prevents negative balance (minimum $0)
- Real-time preview before confirming
- Separate notifications for add vs subtract
- Only ADD operations affect VIP level progression
- Subtract/Set operations don't reduce totalDeposited (prevents VIP downgrade)
