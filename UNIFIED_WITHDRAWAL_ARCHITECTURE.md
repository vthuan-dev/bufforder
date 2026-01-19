# Unified Withdrawal Methods - Architecture

## Component Hierarchy

```
MyPage
  └── WithdrawalMethodsPage
      ├── Header (with back button)
      ├── TabNavigation
      │   ├── Bank Cards Tab Button
      │   └── USDT Wallets Tab Button
      ├── BankCardsTab (conditional)
      │   ├── Add Card Button
      │   ├── Add Card Form (conditional)
      │   ├── Card List
      │   │   └── Card Item (blue gradient)
      │   │       ├── Bank Name
      │   │       ├── Card Number
      │   │       ├── Holder Name
      │   │       ├── Set Default Button
      │   │       └── Delete Button
      │   └── Empty State
      └── USDTWalletsTab (conditional)
          ├── Add Wallet Button
          ├── Add Wallet Form (conditional)
          │   ├── Wallet Name Input
          │   ├── Network Selection (TRC20/ERC20)
          │   └── Wallet Address Input
          ├── Wallet List
          │   └── Wallet Item (purple gradient)
          │       ├── Wallet Name
          │       ├── Wallet Address (masked)
          │       ├── Network
          │       ├── Set Default Button
          │       └── Delete Button
          └── Empty State
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                  WithdrawalMethodsPage                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              useTabState Hook                     │  │
│  │  - activeTab: 'bank' | 'usdt'                    │  │
│  │  - switchTab()                                    │  │
│  │  - Persists to localStorage                      │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│         ┌───────────────┴───────────────┐              │
│         │                               │              │
│  ┌──────▼──────┐                 ┌──────▼──────┐      │
│  │BankCardsTab │                 │USDTWalletsTab│      │
│  │             │                 │              │      │
│  │ useBankCards│                 │useUSDTWallets│      │
│  │   Hook      │                 │   Hook       │      │
│  │             │                 │              │      │
│  │ - cards[]   │                 │ - wallets[]  │      │
│  │ - addCard() │                 │ - addWallet()│      │
│  │ - delete()  │                 │ - delete()   │      │
│  │ - setDefault│                 │ - setDefault()│     │
│  └─────┬───────┘                 └──────┬───────┘      │
│        │                                │              │
│        └────────────┬───────────────────┘              │
│                     │                                  │
│              ┌──────▼──────┐                          │
│              │   API Layer  │                          │
│              │              │                          │
│              │ - getBankCards()                       │
│              │ - addBankCard()                        │
│              │ - deleteBankCard()                     │
│              │ - setDefaultBankCard()                 │
│              │ - getUsdtWallets()                     │
│              │ - addUsdtWallet()                      │
│              │ - deleteUsdtWallet()                   │
│              │ - setDefaultUsdtWallet()               │
│              └─────────────┘                          │
└─────────────────────────────────────────────────────────┘
```

## State Management

### Tab State (useTabState)
```typescript
{
  activeTab: 'bank' | 'usdt',
  switchTab: (tab: TabType) => void,
  isBank: boolean,
  isUSDT: boolean
}
```
- Persisted to localStorage key: `withdrawal-methods-active-tab`
- Restored on component mount

### Bank Cards State (useBankCards)
```typescript
{
  cards: BankCard[],
  isLoading: boolean,
  error: string | null,
  addCard: (input: BankCardInput) => Promise<Result>,
  deleteCard: (id: string) => Promise<Result>,
  setDefault: (id: string) => Promise<Result>,
  refetch: () => Promise<void>
}
```

### USDT Wallets State (useUSDTWallets)
```typescript
{
  wallets: USDTWallet[],
  isLoading: boolean,
  error: string | null,
  addWallet: (input: USDTWalletInput) => Promise<Result>,
  deleteWallet: (id: string) => Promise<Result>,
  setDefault: (id: string) => Promise<Result>,
  refetch: () => Promise<void>
}
```

## Styling System

### Color Scheme
- **Bank Cards**: Blue gradient (`from-blue-500 to-blue-600`)
- **USDT Wallets**: Purple gradient (`from-purple-500 to-purple-600`)
- **Active Tab**: Blue (`bg-blue-600`)
- **Inactive Tab**: Gray (`bg-transparent text-gray-600`)
- **Success Toast**: Green (`bg-green-500`)
- **Error Toast**: Red (`bg-red-500`)

### Animations
- Tab switching: Slide left/right with fade
- Card/Wallet items: Fade in with stagger
- Form expand/collapse: Height animation
- Buttons: Scale on tap
- Toast: Slide down from top

## API Integration

### Endpoints Used
```
GET    /api/bank-cards          → Fetch all bank cards
POST   /api/bank-cards          → Add new bank card
DELETE /api/bank-cards/:id      → Delete bank card
PUT    /api/bank-cards/:id      → Set default bank card

GET    /api/usdt-wallets        → Fetch all USDT wallets
POST   /api/usdt-wallets        → Add new USDT wallet
DELETE /api/usdt-wallets/:id    → Delete USDT wallet
PUT    /api/usdt-wallets/:id    → Set default USDT wallet
```

### Response Format
```typescript
{
  success: boolean,
  data: {
    bankCards?: BankCard[],
    usdtWallets?: USDTWallet[]
  },
  message?: string
}
```

## User Flows

### Add Bank Card Flow
1. User clicks "Add New Card" button
2. Form expands with animation
3. User fills in bank name (with autocomplete), card number, holder name
4. User clicks "Add Card"
5. Loading state shows spinner
6. API call to POST /api/bank-cards
7. On success:
   - Form closes
   - Card list updates
   - Success toast appears
   - If first card, auto-set as default
8. On error:
   - Error toast appears
   - Form stays open

### Add USDT Wallet Flow
1. User clicks "Add New Wallet" button
2. Form expands with animation
3. User fills in wallet name
4. User selects network (TRC20 or ERC20)
5. User enters wallet address
6. User clicks "Add Wallet"
7. Loading state shows spinner
8. API call to POST /api/usdt-wallets
9. On success:
   - Form closes
   - Wallet list updates
   - Success toast appears
   - If first wallet, auto-set as default
10. On error:
    - Error toast appears
    - Form stays open

### Delete Flow
1. User clicks delete button on card/wallet
2. Confirmation dialog appears
3. If confirmed:
   - API call to DELETE endpoint
   - On success:
     - Item removed from list
     - If was default, next item becomes default
     - Success toast appears
   - On error:
     - Error toast appears
     - Item remains in list

### Set Default Flow
1. User clicks "Set Default" button
2. API call to PUT endpoint
3. On success:
   - Previous default loses badge
   - New item gets default badge
   - List re-renders
4. On error:
   - Error toast appears
   - State unchanged

### Tab Switch Flow
1. User clicks tab button
2. Active tab state updates
3. New tab saved to localStorage
4. Content animates out (slide + fade)
5. New content animates in (slide + fade)
6. Data preserved (no refetch)

## Performance Considerations

### Lazy Loading
- WithdrawalMethodsPage is lazy loaded
- Only loaded when user navigates to it
- Reduces initial bundle size

### Memoization
- useCallback for hook functions
- Prevents unnecessary re-renders
- Stable function references

### Optimistic Updates
- UI updates immediately
- API call happens in background
- Rollback on error (future enhancement)

### Caching
- Tab state cached in localStorage
- API responses cached in hook state
- No refetch on tab switch

## Accessibility

### Keyboard Navigation
- Tab key moves between interactive elements
- Enter/Space activates buttons
- Escape closes forms/modals

### Screen Reader Support
- Semantic HTML elements
- ARIA labels on icons
- Proper heading hierarchy
- Focus management

### Visual Indicators
- Focus rings on interactive elements
- Loading states with spinners
- Success/error feedback via toasts
- Clear button labels

## Error Handling

### Validation Errors
- Empty fields → "Please fill in all fields"
- Invalid format → Specific format message
- Displayed via toast notification

### Network Errors
- API timeout → "Request timed out"
- Server error → "Failed to [action]"
- No connection → "Network error"
- Displayed via toast notification

### User Errors
- Delete confirmation → Prevents accidental deletion
- Form validation → Prevents invalid data
- Clear error messages → User knows what to fix

## Future Enhancements

### Performance (Task 10)
- [ ] React.memo for list items
- [ ] API response caching
- [ ] Optimistic UI updates with rollback

### Accessibility (Task 11)
- [ ] Enhanced ARIA labels
- [ ] Arrow key navigation in tabs
- [ ] Screen reader testing

### Testing (Tasks 1.1-13.2)
- [ ] Unit tests for all components
- [ ] Property-based tests
- [ ] Integration tests
- [ ] Visual regression tests

### Features
- [ ] Bulk operations (delete multiple)
- [ ] Search/filter payment methods
- [ ] Export payment methods
- [ ] Import payment methods
- [ ] Payment method verification
