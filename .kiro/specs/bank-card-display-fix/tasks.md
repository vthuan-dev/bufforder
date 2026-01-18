# Implementation Plan: Bank Card Display Fix

## Overview

This plan fixes the bank card display issue by optimizing data flow and implementing proper cache invalidation. The changes are focused on the frontend with no backend modifications needed.

## Tasks

- [x] 1. Update API service to clear cache on mutations
  - Add `clearCache()` call at the start of `addBankCard` method
  - Add `clearCache()` call at the start of `deleteBankCard` method
  - Set `useCache: false` for both mutation requests
  - _Requirements: 2.1, 2.2, 1.4_

- [x] 2. Fix handleAddCard in BankCardPage component
  - Add `api.clearCache()` call before the `addBankCard` API call
  - Remove the redundant `api.getBankCards()` call after successful add
  - Use the response data directly from `addBankCard` to update the cards state
  - Ensure card number masking is applied to the response data
  - _Requirements: 1.1, 1.2, 1.4, 3.1_

- [x] 3. Fix handleDelete in BankCardPage component
  - Add `api.clearCache()` call before the `deleteBankCard` API call
  - Replace manual state filtering with backend response data
  - Use the response data from `deleteBankCard` to update the cards state
  - Apply card number masking to the response data
  - _Requirements: 2.2, 3.1_

- [x] 4. Verify error handling
  - Ensure errors are caught and displayed to users
  - Verify that card list state is not modified on errors
  - Check that errors are logged to console
  - Test network timeout scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Manual testing
  - Test adding a new bank card and verify immediate display
  - Test deleting a bank card and verify immediate removal
  - Test setting a card as default
  - Test with slow network connection
  - Test error scenarios (network error, validation error)
  - Verify card number masking is consistent
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 4.1, 4.2_

## Notes

- All changes are in the frontend only
- No database migrations needed
- No backend API changes required
- Changes are isolated to BankCardPage component and API service
- Testing should focus on the add and delete card flows
