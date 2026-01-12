# Implementation Plan: Internationalization - Vietnamese to English Translation

## Overview

This implementation plan converts the web application interface from Vietnamese to English using a lightweight translation system. The approach focuses on creating a simple translation utility, defining translation files, and systematically replacing Vietnamese text in all components.

## Tasks

- [ ] 1. Set up translation infrastructure
  - Create `frontend/src/locales/` directory
  - Create translation utility with TypeScript types
  - Set up async loading and caching
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.1 Create translation utility file
  - Create `frontend/src/locales/index.ts`
  - Implement `loadTranslations()` function for async loading
  - Implement `t()` function for translation lookup with parameter substitution
  - Implement `useTranslation()` React hook
  - Add TypeScript types for translation keys
  - Initialize with English locale by default
  - _Requirements: 1.4, 1.5, 12.1, 12.2_

- [ ] 1.2 Write unit tests for translation utility
  - Test translation key lookup
  - Test missing key fallback behavior
  - Test parameter substitution (single and multiple parameters)
  - Test nested translation keys
  - Test default locale initialization
  - _Requirements: 1.4, 1.5_

- [ ] 2. Create translation files
  - Create English translation file with all keys
  - Create Vietnamese translation file for backward compatibility
  - Organize translations by feature area
  - _Requirements: 1.2, 1.3, 10.1, 10.3_

- [ ] 2.1 Create English translation file
  - Create `frontend/src/locales/en.json`
  - Add `orders.*` translations (placeOrderNow, clickToPlaceOrder, commissionEarned, availableBalance, todaysTask, completedToday, ordersReceived, dollars, processing, etc.)
  - Add `nav.*` translations (home, record, orders, help, my)
  - Add `home.*` translations (membershipLevel, amountRequired, commissionPerOrder, numberOfOrders)
  - Add `my.*` translations (myProfile, availableBalance, freezeBalance, shippingAddress, topUp, withdrawal, etc.)
  - Add `admin.*` translations (commissionSettings, commissionPerOrder, orders, leaveEmptyForDefault)
  - Add `common.*` translations (confirm, cancel, save, delete, edit, close, loading, error, success)
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 2.2 Create Vietnamese translation file
  - Create `frontend/src/locales/vi.json`
  - Mirror structure of en.json with Vietnamese translations
  - Ensure all keys from en.json exist in vi.json
  - _Requirements: 1.3, 10.1, 10.3, 10.4_

- [ ] 2.3 Write property test for translation completeness
  - **Property 3: Translation Completeness**
  - **Validates: Requirements 10.1, 10.3**
  - Generate all keys from en.json
  - Verify each key exists in vi.json with same structure
  - _Requirements: 10.1, 10.3_

- [ ] 2.4 Write property test for no Vietnamese characters in English
  - **Property 2: No Vietnamese Characters in UI**
  - **Validates: Requirements 11.5**
  - Generate all translation values from en.json
  - Verify no Vietnamese diacritical characters present
  - _Requirements: 11.5_

- [ ] 3. Translate OrdersPage component
  - Replace all Vietnamese strings with translation keys
  - Update button labels, statistics labels, and dialog text
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 3.1 Import translation hook in OrdersPage
  - Add `import { useTranslation } from '../locales'` at top of file
  - Add `const { t } = useTranslation()` inside component
  - _Requirements: 2.1_

- [ ] 3.2 Replace button and instruction text
  - Replace "Đặt hàng ngay" with `t('orders.placeOrderNow')`
  - Replace "Nhấn vào nút để đặt hàng ngay bây giờ" with `t('orders.clickToPlaceOrder')`
  - Replace "Processing..." with `t('orders.processing')`
  - _Requirements: 2.1, 2.2_

- [ ] 3.3 Replace statistics labels
  - Replace "Hoa hồng kiếm được" with `t('orders.commissionEarned')`
  - Replace "Số dư khả dụng" with `t('orders.availableBalance')`
  - Replace "Nhiệm vụ hôm nay" with `t('orders.todaysTask')`
  - Replace "Hoàn thành hôm nay" with `t('orders.completedToday')`
  - Replace "Đơn hàng đã nhận" with `t('orders.ordersReceived')`
  - Replace "đô la" with `t('orders.dollars')`
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 3.4 Replace order popup dialog text
  - Replace "Order is processing" with `t('orders.orderIsProcessing')`
  - Replace "Cancel queue" with `t('orders.cancelQueue')`
  - Replace "Procedure:" with `t('orders.procedure')`
  - Replace procedure steps with `t('orders.procedureStep1')` and `t('orders.procedureStep2')`
  - Replace "Many users are competing..." with `t('orders.manyUsersCompeting', { position: 11 })`
  - Replace "Tip: Upgrading your VIP..." with `t('orders.tipUpgradeVip')`
  - _Requirements: 2.1, 8.1, 8.2_

- [ ] 3.5 Write integration test for OrdersPage
  - Render OrdersPage component
  - Verify all Vietnamese text replaced with English
  - Verify button labels, statistics, and dialog text in English
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 4. Translate AdminUsersPage component
  - Replace Vietnamese text in admin commission settings
  - _Requirements: 8.1, 8.2_

- [ ] 4.1 Replace admin commission settings text
  - Import translation hook
  - Replace "Cài đặt hoa hồng" with `t('admin.commissionSettings')`
  - Replace "Hoa hồng mỗi đơn ($)" with `t('admin.commissionPerOrder')`
  - Replace "Đơn hàng: " with `t('admin.orders')`
  - Replace "Để trống để sử dụng giá trị mặc định theo VIP level" with `t('admin.leaveEmptyForDefault')`
  - _Requirements: 8.1, 8.2_

- [ ] 4.2 Write integration test for AdminUsersPage
  - Render AdminUsersPage component
  - Verify commission settings section in English
  - _Requirements: 8.1, 8.2_

- [ ] 5. Verify all components translated
  - Scan all component files for Vietnamese text
  - Update any remaining Vietnamese strings
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 5.1 Search for Vietnamese characters in components
  - Use grep/search to find Vietnamese diacritical characters in `frontend/src/components/**/*.tsx`
  - Create list of files with Vietnamese text
  - _Requirements: 11.1, 11.2, 11.5_

- [ ] 5.2 Translate remaining components
  - For each file with Vietnamese text, add translation keys to en.json/vi.json
  - Replace Vietnamese strings with `t()` calls
  - Verify no Vietnamese characters remain
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 5.3 Write property test for translation key existence
  - **Property 1: Translation Key Existence**
  - **Validates: Requirements 1.4, 11.1, 11.2, 11.3, 11.4**
  - Scan all component files for `t('...')` calls
  - Verify each translation key exists in en.json
  - _Requirements: 1.4, 11.1, 11.2, 11.3, 11.4_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property tests
  - Run all integration tests
  - Verify no Vietnamese text visible in UI
  - Ask the user if questions arise

- [ ] 7. Performance optimization and validation
  - Verify bundle size impact
  - Test translation lookup performance
  - Ensure async loading works correctly
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 7.1 Measure bundle size impact
  - Build application before and after i18n changes
  - Compare bundle sizes
  - Verify increase is less than 10KB
  - _Requirements: 12.3_

- [ ] 7.2 Write performance test for translation lookup
  - Measure time for 1000 translation lookups
  - Verify average lookup time < 1ms
  - _Requirements: 12.2, 12.4_

- [ ] 7.3 Write performance test for initial load
  - Measure time to interactive before and after i18n
  - Verify no significant degradation (< 50ms difference)
  - _Requirements: 12.1, 12.4_

- [ ] 8. Documentation and cleanup
  - Update README with i18n usage instructions
  - Document how to add new translations
  - Document how to add new languages
  - _Requirements: 10.2, 10.4_

- [ ] 8.1 Create i18n documentation
  - Document translation utility API
  - Provide examples of adding new translation keys
  - Explain how to add new language files
  - Document translation key naming conventions
  - _Requirements: 10.2, 10.4_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify all Vietnamese text replaced
  - Verify performance metrics met
  - Verify backward compatibility maintained
  - Ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end translation functionality
- Performance tests ensure no degradation in load times

