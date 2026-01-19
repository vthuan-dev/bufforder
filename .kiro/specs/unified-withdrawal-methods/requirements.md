# Requirements Document: Unified Withdrawal Methods

## Introduction

This specification describes the consolidation of Bank Cards and USDT Wallets management into a single unified "Withdrawal Methods" page. The goal is to improve user experience by providing a centralized location for managing all withdrawal payment methods through a tab-based interface.

## Glossary

- **Withdrawal_Methods_Page**: The unified page that displays both bank cards and USDT wallets
- **Bank_Card**: A traditional bank account card used for withdrawals
- **USDT_Wallet**: A cryptocurrency wallet address (TRC20 or ERC20) for USDT withdrawals
- **Tab_Navigation**: UI component allowing users to switch between Bank Cards and USDT Wallets views
- **Payment_Method**: Generic term for either a Bank Card or USDT Wallet
- **Default_Method**: The payment method marked as default for quick selection during withdrawals
- **Method_Type**: The category of payment method (either "bank" or "usdt")

## Requirements

### Requirement 1: Unified Navigation

**User Story:** As a user, I want to access all my withdrawal methods from a single menu item, so that I can manage my payment options more efficiently.

#### Acceptance Criteria

1. THE MyPage_Menu SHALL display a single "Withdrawal Methods" menu item instead of separate "Bank Cards" and "USDT Wallets" items
2. WHEN a user clicks "Withdrawal Methods", THE System SHALL navigate to the unified Withdrawal Methods page
3. THE Withdrawal_Methods_Page SHALL display a tab navigation component with "Bank Cards" and "USDT Wallets" tabs
4. THE System SHALL maintain the same icon and styling consistency as other menu items

### Requirement 2: Tab-Based Interface

**User Story:** As a user, I want to switch between viewing my bank cards and USDT wallets using tabs, so that I can easily access the payment method I need.

#### Acceptance Criteria

1. THE Withdrawal_Methods_Page SHALL display two tabs: "Bank Cards" and "USDT Wallets"
2. WHEN a user clicks a tab, THE System SHALL display the corresponding payment methods without page reload
3. THE active tab SHALL be visually highlighted with blue color
4. THE inactive tab SHALL be displayed in gray color
5. WHEN switching tabs, THE System SHALL animate the transition smoothly
6. THE System SHALL remember the last active tab when user returns to the page

### Requirement 3: Bank Cards Tab Functionality

**User Story:** As a user, I want to manage my bank cards in the Bank Cards tab, so that I can add, view, and delete my bank account information.

#### Acceptance Criteria

1. WHEN the Bank Cards tab is active, THE System SHALL display all saved bank cards
2. THE System SHALL display an "Add New Card" button at the top of the list
3. WHEN a user clicks "Add New Card", THE System SHALL show the bank card form with fields for bank name, account number, and account holder name
4. WHEN a user submits a valid bank card, THE System SHALL save it and display it in the list
5. WHEN a user clicks delete on a card, THE System SHALL prompt for confirmation and remove the card upon approval
6. THE System SHALL allow users to set any card as default
7. THE first card added SHALL automatically be set as default
8. WHEN a card is deleted and it was the default, THE System SHALL automatically set another card as default if available

### Requirement 4: USDT Wallets Tab Functionality

**User Story:** As a user, I want to manage my USDT wallets in the USDT Wallets tab, so that I can add, view, and delete my cryptocurrency wallet addresses.

#### Acceptance Criteria

1. WHEN the USDT Wallets tab is active, THE System SHALL display all saved USDT wallets
2. THE System SHALL display an "Add New Wallet" button at the top of the list
3. WHEN a user clicks "Add New Wallet", THE System SHALL show the wallet form with fields for wallet name, network selection (TRC20/ERC20), and wallet address
4. WHEN a user submits a valid wallet, THE System SHALL save it and display it in the list
5. WHEN a user clicks delete on a wallet, THE System SHALL prompt for confirmation and remove the wallet upon approval
6. THE System SHALL allow users to set any wallet as default
7. THE first wallet added SHALL automatically be set as default
8. WHEN a wallet is deleted and it was the default, THE System SHALL automatically set another wallet as default if available

### Requirement 5: Visual Consistency

**User Story:** As a user, I want the unified page to maintain the same visual design as the original separate pages, so that the interface feels familiar and cohesive.

#### Acceptance Criteria

1. THE Bank Cards tab content SHALL use the same blue gradient card design as the original BankCardPage
2. THE USDT Wallets tab content SHALL use the same purple gradient card design as the original USDTWalletPage
3. THE System SHALL display the same icons (CreditCard for banks, Wallet for USDT)
4. THE System SHALL use the same animations and transitions as the original pages
5. THE System SHALL display toast notifications for success and error messages
6. THE empty state messages SHALL be displayed when no payment methods exist in a tab

### Requirement 6: Data Persistence

**User Story:** As a user, I want my payment methods to be saved securely, so that I can use them for future withdrawals.

#### Acceptance Criteria

1. WHEN a user adds a bank card, THE System SHALL persist it to the database via the existing `/api/vip/bank-cards` endpoint
2. WHEN a user adds a USDT wallet, THE System SHALL persist it to the database via the existing `/api/usdt-wallets` endpoint
3. WHEN a user deletes a payment method, THE System SHALL remove it from the database
4. WHEN a user sets a payment method as default, THE System SHALL update the database accordingly
5. THE System SHALL fetch payment methods from the backend when the page loads
6. THE System SHALL handle API errors gracefully and display appropriate error messages

### Requirement 7: Responsive Design

**User Story:** As a user, I want the withdrawal methods page to work well on mobile devices, so that I can manage my payment methods on any device.

#### Acceptance Criteria

1. THE Withdrawal_Methods_Page SHALL be fully responsive on mobile, tablet, and desktop screens
2. THE tab navigation SHALL be touch-friendly on mobile devices
3. THE payment method cards SHALL stack vertically on mobile screens
4. THE forms SHALL be easy to fill out on mobile keyboards
5. THE System SHALL maintain proper spacing and padding on all screen sizes

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want to ensure existing functionality continues to work, so that users experience no disruption during the transition.

#### Acceptance Criteria

1. THE existing backend API endpoints SHALL remain unchanged
2. THE existing BankCard and UsdtWallet database models SHALL remain unchanged
3. THE withdrawal flow SHALL continue to work with both bank cards and USDT wallets
4. THE System SHALL support all existing validation rules for bank cards and USDT wallets
5. THE existing API service methods SHALL be reused without modification

### Requirement 9: Performance

**User Story:** As a user, I want the page to load quickly and switch between tabs smoothly, so that I have a responsive experience.

#### Acceptance Criteria

1. THE Withdrawal_Methods_Page SHALL load within 2 seconds on a standard connection
2. WHEN switching tabs, THE System SHALL render the new content within 300ms
3. THE System SHALL lazy-load tab content to improve initial page load time
4. THE System SHALL cache API responses appropriately to reduce redundant requests
5. THE System SHALL use optimistic UI updates when adding or deleting payment methods

### Requirement 10: Accessibility

**User Story:** As a user with accessibility needs, I want the page to be keyboard navigable and screen reader friendly, so that I can manage my payment methods independently.

#### Acceptance Criteria

1. THE tab navigation SHALL be keyboard accessible using Tab and Arrow keys
2. THE active tab SHALL have proper ARIA attributes for screen readers
3. THE forms SHALL have proper labels and error messages for screen readers
4. THE delete buttons SHALL have confirmation dialogs that are keyboard accessible
5. THE System SHALL maintain proper focus management when switching tabs

## Out of Scope

The following items are explicitly out of scope for this specification:

1. Changes to backend API structure or endpoints
2. Changes to database schema or models
3. Integration with the withdrawal flow (will be addressed separately)
4. Addition of new payment method types beyond Bank Cards and USDT Wallets
5. Multi-language support (will use existing i18n if available)
6. Admin panel changes for viewing user payment methods

## Success Criteria

This feature will be considered successful when:

1. Users can access both bank cards and USDT wallets from a single menu item
2. Tab switching is smooth and intuitive
3. All existing functionality for managing bank cards and USDT wallets is preserved
4. The page maintains visual consistency with the rest of the application
5. No regressions are introduced in existing withdrawal functionality
6. User feedback indicates improved ease of use compared to separate pages

## Dependencies

- Existing BankCardPage component and functionality
- Existing USDTWalletPage component and functionality
- Existing backend API endpoints for bank cards and USDT wallets
- Framer Motion library for animations
- Lucide React for icons
