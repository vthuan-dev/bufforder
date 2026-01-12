# Requirements Document

## Introduction

This feature implements internationalization (i18n) to translate the entire web application interface from Vietnamese to English. The system currently displays mixed Vietnamese and English text throughout the user interface, creating an inconsistent user experience. This feature will standardize all user-facing text to English while maintaining the existing functionality and visual design.

## Glossary

- **i18n**: Internationalization - the process of designing software to support multiple languages
- **Translation_Key**: A unique identifier for each translatable text string
- **Frontend**: The React + TypeScript user interface layer
- **Component**: A reusable UI element in React
- **Locale**: The language and regional settings (e.g., "en" for English, "vi" for Vietnamese)
- **Translation_File**: A JSON file containing key-value pairs of translation strings

## Requirements

### Requirement 1: Translation Infrastructure

**User Story:** As a developer, I want a centralized translation system, so that I can manage all text translations in one place.

#### Acceptance Criteria

1. THE System SHALL create a translations directory structure at `frontend/src/locales/`
2. THE System SHALL provide translation files for English locale at `frontend/src/locales/en.json`
3. THE System SHALL provide translation files for Vietnamese locale at `frontend/src/locales/vi.json`
4. THE System SHALL implement a translation utility function that accepts a translation key and returns the translated string
5. THE System SHALL default to English locale when no locale is specified

### Requirement 2: Orders Page Translation

**User Story:** As a user, I want to see the Orders page in English, so that I can understand the order taking process.

#### Acceptance Criteria

1. WHEN viewing the Orders page, THE System SHALL display "Place Order Now" instead of "Đặt hàng ngay"
2. WHEN viewing the Orders page, THE System SHALL display "Click the button to place an order now" instead of "Nhấn vào nút để đặt hàng ngay bây giờ"
3. WHEN viewing order statistics, THE System SHALL display "Commission Earned" instead of "Hoa hồng kiếm được"
4. WHEN viewing order statistics, THE System SHALL display "Available Balance" instead of "Số dư khả dụng"
5. WHEN viewing order statistics, THE System SHALL display "Today's Task" instead of "Nhiệm vụ hôm nay"
6. WHEN viewing order statistics, THE System SHALL display "Completed Today" instead of "Hoàn thành hôm nay"
7. WHEN viewing order statistics, THE System SHALL display "Orders Received" instead of "Đơn hàng đã nhận"
8. WHEN viewing order statistics, THE System SHALL display "dollars" instead of "đô la"

### Requirement 3: Bottom Navigation Translation

**User Story:** As a user, I want to see navigation labels in English, so that I can easily navigate the application.

#### Acceptance Criteria

1. THE System SHALL maintain "Home" label for home navigation (already in English)
2. THE System SHALL maintain "Record" label for record navigation (already in English)
3. THE System SHALL maintain "Orders" label for orders navigation (already in English)
4. THE System SHALL maintain "Help" label for help navigation (already in English)
5. THE System SHALL maintain "My" label for profile navigation (already in English)

### Requirement 4: Home Page Translation

**User Story:** As a user, I want to see VIP membership information in English, so that I can understand the benefits of each level.

#### Acceptance Criteria

1. THE System SHALL maintain "MEMBERSHIP LEVEL" heading (already in English)
2. THE System SHALL maintain "Amount Required:" label (already in English)
3. THE System SHALL maintain "Commission per order:" label (already in English)
4. THE System SHALL maintain "Number of orders:" label (already in English)
5. THE System SHALL maintain all VIP level names in English (already in English)

### Requirement 5: My Page Translation

**User Story:** As a user, I want to see my profile page in English, so that I can manage my account settings.

#### Acceptance Criteria

1. THE System SHALL maintain "My Profile" heading (already in English)
2. THE System SHALL maintain "Available Balance" label (already in English)
3. THE System SHALL maintain "Freeze Balance" label (already in English)
4. THE System SHALL maintain "Shipping Address" menu item (already in English)
5. THE System SHALL maintain "Top up" menu item (already in English)
6. THE System SHALL maintain "Withdrawal" menu item (already in English)
7. THE System SHALL maintain "Deposit and Withdrawal Records" menu item (already in English)
8. THE System SHALL maintain "Withdrawal bank card" menu item (already in English)
9. THE System SHALL maintain "Security Center" menu item (already in English)
10. THE System SHALL maintain "Logout" button (already in English)

### Requirement 6: Record Page Translation

**User Story:** As a user, I want to see my order history in English, so that I can review my past transactions.

#### Acceptance Criteria

1. WHEN viewing the Record page, THE System SHALL display all order status labels in English
2. WHEN viewing order details, THE System SHALL display all field labels in English
3. WHEN viewing order history, THE System SHALL display date and time formats in English locale

### Requirement 7: Help Page Translation

**User Story:** As a user, I want to see the help/chat interface in English, so that I can communicate with support.

#### Acceptance Criteria

1. WHEN viewing the Help page, THE System SHALL display all chat interface labels in English
2. WHEN viewing chat messages, THE System SHALL display timestamps in English locale
3. WHEN viewing chat status, THE System SHALL display connection status in English

### Requirement 8: Form and Dialog Translation

**User Story:** As a user, I want to see all forms and dialogs in English, so that I can complete transactions accurately.

#### Acceptance Criteria

1. WHEN viewing any form, THE System SHALL display all field labels in English
2. WHEN viewing any dialog, THE System SHALL display all button labels in English
3. WHEN viewing validation messages, THE System SHALL display all error messages in English
4. WHEN viewing success messages, THE System SHALL display all confirmation messages in English

### Requirement 9: Date and Number Formatting

**User Story:** As a user, I want to see dates and numbers formatted in English locale, so that I can understand the information clearly.

#### Acceptance Criteria

1. WHEN displaying dates, THE System SHALL use English month names (January, February, etc.)
2. WHEN displaying currency, THE System SHALL use "dollars" or "$" symbol
3. WHEN displaying numbers, THE System SHALL use comma as thousands separator and period as decimal separator
4. WHEN displaying time, THE System SHALL use 12-hour format with AM/PM

### Requirement 10: Backward Compatibility

**User Story:** As a developer, I want to maintain Vietnamese translations, so that we can support multiple languages in the future.

#### Acceptance Criteria

1. THE System SHALL preserve all Vietnamese translations in `vi.json` file
2. THE System SHALL allow switching between English and Vietnamese locales programmatically
3. THE System SHALL not remove any existing Vietnamese text from the codebase
4. THE System SHALL structure translation files to support easy addition of new languages

### Requirement 11: Translation Coverage

**User Story:** As a developer, I want complete translation coverage, so that no Vietnamese text remains visible to users.

#### Acceptance Criteria

1. THE System SHALL translate all hardcoded Vietnamese strings in component files
2. THE System SHALL translate all Vietnamese strings in constant files
3. THE System SHALL translate all Vietnamese strings in utility files
4. THE System SHALL translate all Vietnamese strings in service files
5. THE System SHALL verify that no Vietnamese characters (à, á, ả, ã, ạ, ă, ằ, ắ, ẳ, ẵ, ặ, â, ầ, ấ, ẩ, ẫ, ậ, đ, è, é, ẻ, ẽ, ẹ, ê, ề, ế, ể, ễ, ệ, ì, í, ỉ, ĩ, ị, ò, ó, ỏ, õ, ọ, ô, ồ, ố, ổ, ỗ, ộ, ơ, ờ, ớ, ở, ỡ, ợ, ù, ú, ủ, ũ, ụ, ư, ừ, ứ, ử, ữ, ự, ỳ, ý, ỷ, ỹ, ỵ) appear in user-facing text

### Requirement 12: Performance

**User Story:** As a user, I want the application to load quickly, so that I can access features without delay.

#### Acceptance Criteria

1. THE System SHALL load translation files asynchronously to avoid blocking initial render
2. THE System SHALL cache loaded translations in memory
3. THE System SHALL not increase initial bundle size by more than 10KB
4. THE System SHALL maintain current page load performance metrics

