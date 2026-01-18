# Manual Testing Checklist

## Prerequisites
- [ ] Backend server is running
- [ ] Frontend dev server is running
- [ ] You are logged in as a user

## Test Cases

### ✅ Test 1: Add New Bank Card
**Steps:**
1. Navigate to "Thẻ ngân hàng" (Bank Cards) page
2. Click "Thêm thẻ mới" (Add New Card) button
3. Fill in all fields:
   - Bank Name: e.g., "Vietcombank"
   - Account Number: e.g., "1234567890"
   - Account Holder Name: e.g., "NGUYEN VAN A"
4. Click "Add Card" button

**Expected Result:**
- [ ] Success toast appears: "Card added successfully!"
- [ ] New card appears in the list immediately (no delay)
- [ ] Card number is masked: "**** **** **** 7890"
- [ ] Card is marked as default if it's the first card
- [ ] Form is cleared and closed
- [ ] No console errors

**Check Network Tab:**
- [ ] Only ONE API call to `/api/vip/bank-cards` (POST)
- [ ] NO second call to GET `/api/vip/bank-cards`

---

### ✅ Test 2: Add Multiple Cards
**Steps:**
1. Add a second bank card with different details
2. Add a third bank card

**Expected Result:**
- [ ] All cards appear in the list
- [ ] Each card shows correct information
- [ ] Only the first card is marked as default
- [ ] Card numbers are all masked correctly

---

### ✅ Test 3: Delete Bank Card
**Steps:**
1. Click the delete (trash) button on any card
2. Confirm the deletion in the dialog

**Expected Result:**
- [ ] Success toast appears: "Card deleted successfully!"
- [ ] Card disappears from the list immediately
- [ ] If deleted card was default, another card becomes default
- [ ] Remaining cards are displayed correctly
- [ ] No console errors

**Check Network Tab:**
- [ ] Only ONE API call to `/api/vip/bank-cards/:id` (DELETE)
- [ ] NO second call to GET `/api/vip/bank-cards`

---

### ✅ Test 4: Set Card as Default
**Steps:**
1. Click "Set Default" button on a non-default card

**Expected Result:**
- [ ] Card is marked as default
- [ ] Previous default card loses default status
- [ ] UI updates correctly

---

### ✅ Test 5: Validation Errors
**Steps:**
1. Click "Add New Card"
2. Leave all fields empty
3. Click "Add Card"

**Expected Result:**
- [ ] Error toast appears: "Please fill in all fields"
- [ ] No API call is made
- [ ] Card list remains unchanged

---

### ✅ Test 6: Network Error Simulation
**Steps:**
1. Stop the backend server
2. Try to add a new card

**Expected Result:**
- [ ] Error toast appears with network error message
- [ ] Card list remains unchanged
- [ ] Error is logged to console
- [ ] Loading state is cleared

---

### ✅ Test 7: Page Refresh
**Steps:**
1. Add some cards
2. Refresh the page (F5)

**Expected Result:**
- [ ] All cards are loaded correctly
- [ ] Card numbers are masked
- [ ] Default card is marked correctly

---

### ✅ Test 8: Card Number Masking Consistency
**Steps:**
1. Check all cards in the list

**Expected Result:**
- [ ] All card numbers show format: "**** **** **** XXXX"
- [ ] Last 4 digits are visible
- [ ] Format is consistent across all cards

---

## Performance Checks

### Network Efficiency
- [ ] Adding a card makes only 1 API call (not 2)
- [ ] Deleting a card makes only 1 API call (not 2)
- [ ] No unnecessary API calls on page load

### UI Responsiveness
- [ ] Cards appear immediately after add (no visible delay)
- [ ] Cards disappear immediately after delete
- [ ] Loading states work correctly
- [ ] No UI flickering or jumps

---

## Browser Console Checks

### During Normal Operations
- [ ] No errors in console
- [ ] Cache clear messages appear (if logging enabled)

### During Error Scenarios
- [ ] Errors are logged with descriptive messages
- [ ] Error objects include full details for debugging

---

## Sign-off

**Tested by:** _______________  
**Date:** _______________  
**All tests passed:** [ ] Yes [ ] No  
**Issues found:** _______________

---

## Notes

If any test fails, please note:
1. What was the expected behavior?
2. What actually happened?
3. Any error messages in console?
4. Network tab details (API calls made)
