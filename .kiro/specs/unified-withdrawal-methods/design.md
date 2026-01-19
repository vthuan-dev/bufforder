# Design Document: Unified Withdrawal Methods

## Overview

This design describes the implementation of a unified Withdrawal Methods page that consolidates Bank Cards and USDT Wallets management into a single, tab-based interface. The solution reuses existing components and API endpoints while providing an improved user experience through better organization and navigation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      MyPage                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Menu Items:                                      │ │
│  │  • Shipping Address                               │ │
│  │  • Top up                                         │ │
│  │  • Withdrawal                                     │ │
│  │  • Deposit and Withdrawal Records                 │ │
│  │  • Withdrawal Methods  ← NEW (replaces 2 items)  │ │
│  │  • Security Center                                │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           WithdrawalMethodsPage (NEW)                   │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Tab Navigation                                   │ │
│  │  [Bank Cards] [USDT Wallets]                      │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Tab Content (conditional render)                 │ │
│  │  • BankCardsList (reused logic)                   │ │
│  │  • USDTWalletsList (reused logic)                 │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Existing Backend APIs                      │
│  • GET/POST/DELETE /api/vip/bank-cards                 │
│  • GET/POST/DELETE /api/usdt-wallets                   │
│  • PUT /api/usdt-wallets/:id/default                   │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
WithdrawalMethodsPage
├── Header (Back button + Title)
├── TabNavigation
│   ├── TabButton (Bank Cards)
│   └── TabButton (USDT Wallets)
└── TabContent
    ├── BankCardsTab (when active)
    │   ├── AddButton
    │   ├── AddCardForm (conditional)
    │   ├── CardList
    │   │   └── BankCardItem[]
    │   └── EmptyState (conditional)
    └── USDTWalletsTab (when active)
        ├── AddButton
        ├── AddWalletForm (conditional)
        ├── WalletList
        │   └── USDTWalletItem[]
        └── EmptyState (conditional)
```

## Components and Interfaces

### 1. WithdrawalMethodsPage Component

**Purpose:** Main container component that manages tab state and renders appropriate content.

**Props:**
```typescript
interface WithdrawalMethodsPageProps {
  onBack: () => void;
}
```

**State:**
```typescript
interface WithdrawalMethodsState {
  activeTab: 'bank' | 'usdt';
  bankCards: BankCard[];
  usdtWallets: USDTWallet[];
  isLoading: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;
}
```

**Key Methods:**
- `handleTabChange(tab: 'bank' | 'usdt')` - Switches active tab and persists to localStorage
- `fetchBankCards()` - Loads bank cards from API
- `fetchUSDTWallets()` - Loads USDT wallets from API
- `showToast(message: string, type: 'success' | 'error')` - Displays toast notification

### 2. TabNavigation Component

**Purpose:** Renders tab buttons and handles tab switching.

**Props:**
```typescript
interface TabNavigationProps {
  activeTab: 'bank' | 'usdt';
  onTabChange: (tab: 'bank' | 'usdt') => void;
}
```

**Styling:**
- Active tab: `bg-blue-600 text-white`
- Inactive tab: `bg-gray-100 text-gray-600`
- Smooth transition animation using Framer Motion

### 3. BankCardsTab Component

**Purpose:** Manages bank card list, add form, and interactions.

**Props:**
```typescript
interface BankCardsTabProps {
  cards: BankCard[];
  onAdd: (card: BankCardInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
}
```

**Reuses logic from:** `BankCardPage.tsx`

### 4. USDTWalletsTab Component

**Purpose:** Manages USDT wallet list, add form, and interactions.

**Props:**
```typescript
interface USDTWalletsTabProps {
  wallets: USDTWallet[];
  onAdd: (wallet: USDTWalletInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
}
```

**Reuses logic from:** `USDTWalletPage.tsx`

## Data Models

### BankCard (Existing)
```typescript
interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;  // Masked: **** **** **** 1234
  holderName: string;
  isDefault: boolean;
}
```

### USDTWallet (Existing)
```typescript
interface USDTWallet {
  id: string;
  walletAddress: string;
  walletName: string;
  network: 'TRC20' | 'ERC20';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### TabState (New)
```typescript
type TabType = 'bank' | 'usdt';

interface TabState {
  activeTab: TabType;
  lastVisited: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tab switching preserves data
*For any* tab switch operation, the data in the previously active tab should remain unchanged when switching back.
**Validates: Requirements 2.2**

### Property 2: Default promotion on deletion
*For any* payment method list with multiple items, when the default item is deleted, exactly one of the remaining items should become the new default.
**Validates: Requirements 3.8, 4.8**

### Property 3: API persistence consistency
*For any* add operation (bank card or USDT wallet), the item should appear in the list if and only if the API call succeeds.
**Validates: Requirements 6.1, 6.2**

### Property 4: Single default constraint
*For any* payment method list (bank cards or USDT wallets), at most one item should be marked as default at any time.
**Validates: Requirements 3.6, 4.6**

### Property 5: First item auto-default
*For any* empty payment method list, when the first item is added, it should automatically be marked as default.
**Validates: Requirements 3.7, 4.7**

### Property 6: Error handling displays messages
*For any* API error during add, delete, or update operations, an error toast notification should be displayed to the user.
**Validates: Requirements 6.6**

### Property 7: Tab state persistence
*For any* user session, when leaving and returning to the Withdrawal Methods page, the previously active tab should be restored.
**Validates: Requirements 2.6**

### Property 8: Validation rules enforcement
*For any* invalid input (bank card or USDT wallet), the form submission should be rejected and an error message should be displayed.
**Validates: Requirements 8.4**

### Property 9: Optimistic UI updates
*For any* add or delete operation, the UI should update immediately before the API response is received.
**Validates: Requirements 9.5**

### Property 10: Cache prevents redundant requests
*For any* sequence of operations that don't modify data, the API should be called at most once for fetching the same data.
**Validates: Requirements 9.4**

## Error Handling

### API Errors
- **Network Failure:** Display toast: "Connection error. Please check your network."
- **Server Error (500):** Display toast: "Server error. Please try again later."
- **Validation Error (400):** Display specific validation message from backend
- **Unauthorized (401):** Redirect to login page

### User Input Errors
- **Empty Fields:** Display inline error: "This field is required"
- **Invalid Format:** Display inline error with format requirements
- **Duplicate Entry:** Display toast: "This [card/wallet] already exists"

### State Management Errors
- **Failed to Load Data:** Display empty state with retry button
- **Failed to Save:** Revert optimistic update and show error toast
- **Failed to Delete:** Keep item in list and show error toast

## Testing Strategy

### Unit Tests
- Test tab switching logic
- Test form validation
- Test default promotion logic
- Test API error handling
- Test toast notification display
- Test empty state rendering

### Property-Based Tests (Minimum 100 iterations each)

**Property Test 1: Tab switching data preservation**
```typescript
// Feature: unified-withdrawal-methods, Property 1: Tab switching preserves data
// Generate random bank cards and USDT wallets
// Switch tabs multiple times
// Verify data remains unchanged
```

**Property Test 2: Default promotion consistency**
```typescript
// Feature: unified-withdrawal-methods, Property 2: Default promotion on deletion
// Generate list with multiple items, one default
// Delete the default item
// Verify exactly one remaining item is default
```

**Property Test 3: API persistence**
```typescript
// Feature: unified-withdrawal-methods, Property 3: API persistence consistency
// Generate random payment method data
// Mock API success/failure
// Verify item appears in list iff API succeeds
```

**Property Test 4: Single default constraint**
```typescript
// Feature: unified-withdrawal-methods, Property 4: Single default constraint
// Generate random payment method lists
// Verify at most one item is marked default
```

**Property Test 5: First item auto-default**
```typescript
// Feature: unified-withdrawal-methods, Property 5: First item auto-default
// Start with empty list
// Add first item
// Verify it's marked as default
```

**Property Test 6: Error toast display**
```typescript
// Feature: unified-withdrawal-methods, Property 6: Error handling displays messages
// Generate random API errors
// Trigger operations
// Verify error toast appears
```

**Property Test 7: Tab state persistence**
```typescript
// Feature: unified-withdrawal-methods, Property 7: Tab state persistence
// Set random active tab
// Unmount and remount component
// Verify same tab is active
```

**Property Test 8: Validation enforcement**
```typescript
// Feature: unified-withdrawal-methods, Property 8: Validation rules enforcement
// Generate invalid inputs
// Attempt submission
// Verify rejection and error message
```

**Property Test 9: Optimistic updates**
```typescript
// Feature: unified-withdrawal-methods, Property 9: Optimistic UI updates
// Trigger add/delete operation
// Verify UI updates before API response
```

**Property Test 10: Cache efficiency**
```typescript
// Feature: unified-withdrawal-methods, Property 10: Cache prevents redundant requests
// Perform multiple read operations
// Verify API called only once
```

### Integration Tests
- Test full add/delete/update flows
- Test navigation from MyPage
- Test interaction with withdrawal flow
- Test responsive behavior at different viewports

### Visual Regression Tests
- Compare tab designs with original pages
- Verify animations and transitions
- Check empty states
- Verify toast notifications

## Implementation Notes

### Code Reuse Strategy
1. Extract shared logic from `BankCardPage.tsx` and `USDTWalletPage.tsx` into reusable hooks:
   - `useBankCards()` - Manages bank card state and operations
   - `useUSDTWallets()` - Manages USDT wallet state and operations
   - `usePaymentMethodForm()` - Manages add form state

2. Create shared components:
   - `PaymentMethodCard` - Generic card component with type-specific styling
   - `AddPaymentMethodButton` - Reusable add button
   - `EmptyPaymentMethodState` - Reusable empty state

### Performance Optimizations
1. **Lazy Loading:** Use React.lazy() for tab content components
2. **Memoization:** Use React.memo() for list items to prevent unnecessary re-renders
3. **Debouncing:** Debounce search/filter inputs if added in future
4. **Virtual Scrolling:** Consider for lists with >50 items

### Accessibility Considerations
1. Use semantic HTML (`<nav>`, `<button>`, `<form>`)
2. Add ARIA labels for tab navigation
3. Ensure keyboard navigation works (Tab, Arrow keys, Enter, Escape)
4. Provide focus indicators
5. Use proper heading hierarchy

### Migration Strategy
1. Create new `WithdrawalMethodsPage` component
2. Update `MyPage` to use new component
3. Keep old components temporarily for rollback
4. Monitor for issues in production
5. Remove old components after successful migration

## Future Enhancements

1. **Search/Filter:** Add search functionality for large lists
2. **Sorting:** Allow sorting by date added, name, etc.
3. **Bulk Operations:** Select multiple items for deletion
4. **Import/Export:** Export payment methods as JSON
5. **Payment Method Icons:** Add bank logos and crypto network icons
6. **Quick Actions:** Swipe gestures for mobile (delete, set default)
7. **Analytics:** Track which payment methods are used most
8. **Verification:** Add verification status for payment methods
