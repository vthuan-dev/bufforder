# Implementation Plan: Unified Withdrawal Methods

## Overview

This implementation plan breaks down the Unified Withdrawal Methods feature into discrete, incremental tasks. Each task builds on previous work and includes testing to ensure correctness.

## Tasks

- [x] 1. Create shared hooks for payment method management
  - Extract bank card logic from BankCardPage into `useBankCards` hook
  - Extract USDT wallet logic from USDTWalletPage into `useUSDTWallets` hook
  - Create `useTabState` hook for managing active tab and persistence
  - _Requirements: 2.6, 8.5_

- [ ]* 1.1 Write unit tests for useBankCards hook
  - Test fetching bank cards
  - Test adding bank card
  - Test deleting bank card
  - Test setting default card
  - _Requirements: 3.1, 3.4, 3.5, 3.6_

- [ ]* 1.2 Write unit tests for useUSDTWallets hook
  - Test fetching USDT wallets
  - Test adding USDT wallet
  - Test deleting USDT wallet
  - Test setting default wallet
  - _Requirements: 4.1, 4.4, 4.5, 4.6_

- [ ]* 1.3 Write property test for default promotion logic
  - **Property 2: Default promotion on deletion**
  - **Validates: Requirements 3.8, 4.8**
  - Generate lists with multiple items, delete default, verify new default

- [ ]* 1.4 Write property test for first item auto-default
  - **Property 5: First item auto-default**
  - **Validates: Requirements 3.7, 4.7**
  - Start with empty list, add first item, verify it's default

- [x] 2. Create TabNavigation component
  - Create component with two tab buttons (Bank Cards, USDT Wallets)
  - Implement active/inactive styling
  - Add click handlers for tab switching
  - Add Framer Motion animations for smooth transitions
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4_

- [ ]* 2.1 Write unit tests for TabNavigation
  - Test tab rendering
  - Test active tab styling
  - Test tab click handling
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 3. Create BankCardsTab component
  - Reuse card list rendering from BankCardPage
  - Integrate useBankCards hook
  - Implement add card form
  - Implement delete confirmation
  - Implement set default functionality
  - Add empty state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 3.1 Write unit tests for BankCardsTab
  - Test card list rendering
  - Test add form display
  - Test form submission
  - Test delete confirmation
  - Test empty state
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]* 3.2 Write property test for bank card validation
  - **Property 8: Validation rules enforcement**
  - **Validates: Requirements 8.4**
  - Generate invalid bank card inputs, verify rejection

- [x] 4. Create USDTWalletsTab component
  - Reuse wallet list rendering from USDTWalletPage
  - Integrate useUSDTWallets hook
  - Implement add wallet form with network selection
  - Implement delete confirmation
  - Implement set default functionality
  - Add empty state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 4.1 Write unit tests for USDTWalletsTab
  - Test wallet list rendering
  - Test add form display
  - Test network selection
  - Test form submission
  - Test delete confirmation
  - Test empty state
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 4.2 Write property test for USDT wallet validation
  - **Property 8: Validation rules enforcement**
  - **Validates: Requirements 8.4**
  - Generate invalid USDT wallet inputs (wrong format, wrong network), verify rejection

- [x] 5. Create main WithdrawalMethodsPage component
  - Create page container with header
  - Integrate TabNavigation component
  - Integrate BankCardsTab and USDTWalletsTab
  - Implement tab switching logic
  - Add toast notification system
  - Implement loading states
  - _Requirements: 1.2, 2.2, 5.5_

- [ ]* 5.1 Write unit tests for WithdrawalMethodsPage
  - Test page rendering
  - Test tab switching
  - Test toast notifications
  - Test loading states
  - _Requirements: 1.2, 2.2, 5.5_

- [ ]* 5.2 Write property test for tab switching data preservation
  - **Property 1: Tab switching preserves data**
  - **Validates: Requirements 2.2**
  - Generate random data, switch tabs multiple times, verify data unchanged

- [ ]* 5.3 Write property test for tab state persistence
  - **Property 7: Tab state persistence**
  - **Validates: Requirements 2.6**
  - Set random tab, unmount/remount, verify same tab active

- [x] 6. Update MyPage navigation
  - Remove "Withdrawal bank card" menu item
  - Remove "USDT Wallets" menu item
  - Add single "Withdrawal Methods" menu item
  - Update routing to use WithdrawalMethodsPage
  - Update lazy loading imports
  - _Requirements: 1.1, 1.2_

- [ ]* 6.1 Write unit tests for MyPage navigation
  - Test menu item rendering
  - Test navigation to WithdrawalMethodsPage
  - _Requirements: 1.1, 1.2_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property tests
  - Fix any failing tests
  - Verify no regressions in existing functionality

- [x] 8. Implement visual consistency
  - Apply blue gradient styling to bank card items
  - Apply purple gradient styling to USDT wallet items
  - Add CreditCard and Wallet icons
  - Implement animations matching original pages
  - Style empty states
  - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [ ]* 8.1 Write visual regression tests
  - Capture screenshots of bank cards tab
  - Capture screenshots of USDT wallets tab
  - Compare with original pages
  - _Requirements: 5.1, 5.2_

- [x] 9. Implement error handling
  - Add try-catch blocks for all API calls
  - Display appropriate error toasts
  - Handle network failures
  - Handle validation errors
  - Implement retry logic for failed requests
  - _Requirements: 6.6_

- [ ]* 9.1 Write property test for error handling
  - **Property 6: Error handling displays messages**
  - **Validates: Requirements 6.6**
  - Generate random API errors, verify error toasts appear

- [ ] 10. Implement performance optimizations
  - Add React.lazy() for tab content components
  - Add React.memo() for list items
  - Implement API response caching
  - Add optimistic UI updates
  - _Requirements: 9.3, 9.4, 9.5_

- [ ]* 10.1 Write property test for cache efficiency
  - **Property 10: Cache prevents redundant requests**
  - **Validates: Requirements 9.4**
  - Perform multiple read operations, verify API called once

- [ ]* 10.2 Write property test for optimistic updates
  - **Property 9: Optimistic UI updates**
  - **Validates: Requirements 9.5**
  - Trigger operations, verify UI updates before API response

- [ ] 11. Implement accessibility features
  - Add ARIA labels to tab navigation
  - Ensure keyboard navigation works (Tab, Arrow keys)
  - Add focus indicators
  - Test with screen reader
  - Verify proper heading hierarchy
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 11.1 Write accessibility tests
  - Test keyboard navigation
  - Test ARIA attributes
  - Test focus management
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 12. Implement responsive design
  - Test on mobile viewport (375px)
  - Test on tablet viewport (768px)
  - Test on desktop viewport (1024px+)
  - Adjust spacing and padding for mobile
  - Ensure touch-friendly tap targets
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 12.1 Write responsive design tests
  - Test rendering at different viewports
  - Verify touch-friendly elements on mobile
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 13. Integration testing
  - Test full add bank card flow
  - Test full add USDT wallet flow
  - Test delete flows with confirmation
  - Test set default flows
  - Test tab switching with data
  - Test error scenarios
  - _Requirements: 3.4, 3.5, 3.6, 4.4, 4.5, 4.6_

- [ ]* 13.1 Write property test for API persistence
  - **Property 3: API persistence consistency**
  - **Validates: Requirements 6.1, 6.2**
  - Generate random data, mock API success/failure, verify list updates correctly

- [ ]* 13.2 Write property test for single default constraint
  - **Property 4: Single default constraint**
  - **Validates: Requirements 3.6, 4.6**
  - Generate random lists, verify at most one default at any time

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Run complete test suite
  - Verify all property tests pass (100+ iterations each)
  - Check code coverage
  - Fix any remaining issues
  - Verify no console errors or warnings

- [ ] 15. Clean up and documentation
  - Remove old BankCardPage and USDTWalletPage components (keep for rollback initially)
  - Update component documentation
  - Add JSDoc comments to hooks
  - Update README if needed
  - _Requirements: 8.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests should run minimum 100 iterations each
- Checkpoints ensure incremental validation
- Keep old components temporarily for easy rollback if needed
- All API endpoints remain unchanged (backward compatible)

## Testing Configuration

### Property-Based Testing Setup
- Use `fast-check` library for TypeScript
- Configure minimum 100 iterations per property test
- Tag each test with feature name and property number
- Example tag format: `Feature: unified-withdrawal-methods, Property 1: Tab switching preserves data`

### Test Data Generators
Create generators for:
- Random bank cards (valid and invalid)
- Random USDT wallets (TRC20 and ERC20, valid and invalid)
- Random tab states
- Random API responses (success and error)

## Rollback Plan

If issues are discovered in production:
1. Revert MyPage navigation to use old components
2. Keep new WithdrawalMethodsPage code for future fixes
3. Investigate and fix issues
4. Re-deploy when ready

## Success Metrics

- All unit tests pass
- All property tests pass with 100+ iterations
- No increase in API error rates
- Page load time < 2 seconds
- Tab switch time < 300ms
- Zero accessibility violations
- Positive user feedback on unified interface
