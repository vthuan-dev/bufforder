# 📋 Admin i18n Implementation Plan

## 🎯 Mục tiêu
Implement đa ngôn ngữ (English ↔ Tiếng Việt) cho **TẤT CẢ** các trang Admin của ứng dụng.

## 📊 Tổng quan Admin Pages

### ✅ Danh sách Admin Pages (11 pages/components)

1. **AdminLoginPage** - Trang đăng nhập admin
2. **AdminDashboard** - Dashboard tổng quan với stats
3. **AdminUsersPage** - Quản lý users
4. **AdminOrdersPage** - Quản lý orders
5. **AdminDepositsPage** - Quản lý deposits (nạp tiền)
6. **AdminWithdrawalsPage** - Quản lý withdrawals (rút tiền)
7. **AdminProductsPage** - Quản lý products
8. **AdminChatPage** - Chat support với users
9. **AdminSettingsPage** - Cài đặt hệ thống
10. **AdminLayout** - Layout chung (sidebar, header)
11. **StatCard** - Component hiển thị thống kê

## 📁 Cấu trúc Translation Files

### Translation Files cần tạo (22 files)

```
frontend/src/i18n/locales/
├── en/
│   ├── admin.json              # Common admin terms
│   ├── adminLogin.json         # Login page
│   ├── adminDashboard.json     # Dashboard
│   ├── adminUsers.json         # Users management
│   ├── adminOrders.json        # Orders management
│   ├── adminDeposits.json      # Deposits management
│   ├── adminWithdrawals.json   # Withdrawals management
│   ├── adminProducts.json      # Products management
│   ├── adminChat.json          # Chat support
│   ├── adminSettings.json      # Settings
│   └── adminLayout.json        # Layout (sidebar, nav)
└── vi/
    └── (same structure as en/)
```

## 🔧 Implementation Steps

### Phase 1: Setup & Common Terms
- [ ] 1.1 Create `admin.json` (en/vi) - Common admin terms
  - Buttons: Save, Cancel, Delete, Edit, View, Approve, Reject
  - Status: Active, Inactive, Pending, Approved, Rejected, Completed
  - Actions: Search, Filter, Sort, Export, Refresh
  - Messages: Success, Error, Confirmation dialogs

- [ ] 1.2 Update `i18n/index.ts` to import admin translation files

- [ ] 1.3 Add Language Switcher to AdminLayout header
  - Same Globe icon component as client
  - Position: Top right corner of admin header

### Phase 2: Authentication
- [ ] 2.1 Create `adminLogin.json` (en/vi)
  - Login form labels
  - Error messages
  - Validation messages

- [ ] 2.2 Update `AdminLoginPage.tsx` with `useTranslation`

### Phase 3: Layout & Navigation
- [ ] 3.1 Create `adminLayout.json` (en/vi)
  - Sidebar menu items
  - Header elements
  - User dropdown menu

- [ ] 3.2 Update `AdminLayout.tsx` with `useTranslation`

### Phase 4: Dashboard
- [ ] 4.1 Create `adminDashboard.json` (en/vi)
  - Stats cards titles
  - Chart labels
  - Quick actions

- [ ] 4.2 Update `AdminDashboard.tsx` with `useTranslation`
- [ ] 4.3 Update `StatCard.tsx` with `useTranslation`

### Phase 5: User Management
- [ ] 5.1 Create `adminUsers.json` (en/vi)
  - Table headers
  - User actions (Edit, Delete, View Details)
  - User status labels
  - VIP level labels
  - Modal dialogs (Edit User, Delete Confirmation)
  - Toast notifications

- [ ] 5.2 Update `AdminUsersPage.tsx` with `useTranslation`

### Phase 6: Orders Management
- [ ] 6.1 Create `adminOrders.json` (en/vi)
  - Table headers
  - Order status labels
  - Order actions
  - Filter options
  - Modal dialogs

- [ ] 6.2 Update `AdminOrdersPage.tsx` with `useTranslation`

### Phase 7: Deposits Management
- [ ] 7.1 Create `adminDeposits.json` (en/vi)
  - Table headers
  - Deposit status labels
  - Actions (Approve, Reject)
  - Modal dialogs
  - Toast notifications

- [ ] 7.2 Update `AdminDepositsPage.tsx` with `useTranslation`

### Phase 8: Withdrawals Management
- [ ] 8.1 Create `adminWithdrawals.json` (en/vi)
  - Table headers
  - Withdrawal status labels
  - Withdrawal type labels (Bank, Crypto)
  - Network labels (TRC20, ERC20, etc.)
  - Actions (Approve, Reject)
  - Modal dialogs
  - Toast notifications

- [ ] 8.2 Update `AdminWithdrawalsPage.tsx` with `useTranslation`

### Phase 9: Products Management
- [ ] 9.1 Create `adminProducts.json` (en/vi)
  - Table headers
  - Product form labels
  - Actions (Add, Edit, Delete)
  - Modal dialogs
  - Toast notifications

- [ ] 9.2 Update `AdminProductsPage.tsx` with `useTranslation`

### Phase 10: Chat Support
- [ ] 10.1 Create `adminChat.json` (en/vi)
  - Chat interface labels
  - User list headers
  - Message input placeholder
  - Quick replies
  - Status indicators

- [ ] 10.2 Update `AdminChatPage.tsx` with `useTranslation`

### Phase 11: Settings
- [ ] 11.1 Create `adminSettings.json` (en/vi)
  - Settings sections
  - Form labels
  - VIP configuration
  - Commission settings
  - System settings
  - Toast notifications

- [ ] 11.2 Update `AdminSettingsPage.tsx` with `useTranslation`

### Phase 12: Testing & Validation
- [ ] 12.1 Test all admin pages with English
- [ ] 12.2 Test all admin pages with Vietnamese
- [ ] 12.3 Test language switching
- [ ] 12.4 Verify all toast notifications
- [ ] 12.5 Verify all modal dialogs
- [ ] 12.6 Run `npm run build` to ensure no errors

## 🎨 Design Guidelines

### Language Switcher Position
- **Location**: AdminLayout header, top right corner
- **Icon**: Globe icon (same as client)
- **Style**: Consistent with admin theme (darker colors)

### Translation Principles
1. **Technical Terms**: Keep technical terms in English when appropriate
   - VIP 0, VIP 1, ROYAL VIP (keep as is)
   - Network names: TRC20, ERC20, BEP20 (keep as is)
   - Status codes: HTTP status, API responses (keep as is)

2. **Currency**: Always use USD format
   - $100.00 (keep format)
   - "USD" label can be translated context

3. **Dates & Times**: Use locale-aware formatting
   - English: MM/DD/YYYY
   - Vietnamese: DD/MM/YYYY

4. **Numbers**: Use locale-aware formatting
   - English: 1,000.00
   - Vietnamese: 1.000,00

## 📝 Translation Keys Structure

### Example: adminUsers.json (English)
```json
{
  "title": "User Management",
  "subtitle": "Manage all users and their accounts",
  "search": "Search users...",
  "filters": {
    "all": "All Users",
    "active": "Active",
    "inactive": "Inactive",
    "vip0": "VIP 0",
    "vip1": "VIP 1"
  },
  "table": {
    "name": "Name",
    "email": "Email",
    "balance": "Balance",
    "vipLevel": "VIP Level",
    "status": "Status",
    "actions": "Actions"
  },
  "actions": {
    "edit": "Edit",
    "delete": "Delete",
    "viewDetails": "View Details",
    "adjustBalance": "Adjust Balance"
  },
  "modals": {
    "editUser": {
      "title": "Edit User",
      "nameLabel": "Name",
      "emailLabel": "Email",
      "vipLevelLabel": "VIP Level",
      "save": "Save Changes",
      "cancel": "Cancel"
    },
    "deleteUser": {
      "title": "Delete User",
      "message": "Are you sure you want to delete this user? This action cannot be undone.",
      "confirm": "Delete",
      "cancel": "Cancel"
    }
  },
  "notifications": {
    "userUpdated": "User updated successfully",
    "userDeleted": "User deleted successfully",
    "error": "An error occurred. Please try again."
  }
}
```

### Example: adminUsers.json (Vietnamese)
```json
{
  "title": "Quản lý người dùng",
  "subtitle": "Quản lý tất cả người dùng và tài khoản",
  "search": "Tìm kiếm người dùng...",
  "filters": {
    "all": "Tất cả người dùng",
    "active": "Đang hoạt động",
    "inactive": "Không hoạt động",
    "vip0": "VIP 0",
    "vip1": "VIP 1"
  },
  "table": {
    "name": "Tên",
    "email": "Email",
    "balance": "Số dư",
    "vipLevel": "Cấp VIP",
    "status": "Trạng thái",
    "actions": "Hành động"
  },
  "actions": {
    "edit": "Chỉnh sửa",
    "delete": "Xóa",
    "viewDetails": "Xem chi tiết",
    "adjustBalance": "Điều chỉnh số dư"
  },
  "modals": {
    "editUser": {
      "title": "Chỉnh sửa người dùng",
      "nameLabel": "Tên",
      "emailLabel": "Email",
      "vipLevelLabel": "Cấp VIP",
      "save": "Lưu thay đổi",
      "cancel": "Hủy"
    },
    "deleteUser": {
      "title": "Xóa người dùng",
      "message": "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.",
      "confirm": "Xóa",
      "cancel": "Hủy"
    }
  },
  "notifications": {
    "userUpdated": "Cập nhật người dùng thành công",
    "userDeleted": "Xóa người dùng thành công",
    "error": "Đã xảy ra lỗi. Vui lòng thử lại."
  }
}
```

## ⚠️ Important Notes

1. **Admin vs Client Separation**
   - Admin translations are separate from client translations
   - Admin uses `admin*` namespace
   - Client uses existing namespaces (home, orders, my, etc.)

2. **Language Persistence**
   - Admin language preference stored separately in localStorage
   - Key: `admin_language` (separate from client `language`)
   - This allows admin to use different language than client

3. **Toast Notifications**
   - All toast.success(), toast.error(), toast.warning() must be translated
   - Include both title and description

4. **Modal Dialogs**
   - All modal titles, messages, and buttons must be translated
   - Confirmation dialogs are critical

5. **Table Headers**
   - All table headers must be translated
   - Sort indicators should remain as icons

6. **Status Labels**
   - Status labels should be translated
   - Color coding remains the same

## 🚀 Execution Order

**Recommended order for implementation:**

1. Phase 1: Setup & Common Terms (foundation)
2. Phase 2: Authentication (admin entry point)
3. Phase 3: Layout & Navigation (affects all pages)
4. Phase 4: Dashboard (most visible page)
5. Phase 5-11: Individual pages (can be done in parallel)
6. Phase 12: Testing & Validation

## ✅ Success Criteria

- [ ] All 11 admin pages have full i18n support
- [ ] Language switcher works in admin panel
- [ ] All toast notifications are translated
- [ ] All modal dialogs are translated
- [ ] All table headers are translated
- [ ] All form labels are translated
- [ ] Build passes without errors
- [ ] No console warnings related to i18n
- [ ] Language preference persists across sessions
- [ ] Admin language is independent from client language

## 📊 Estimated Effort

- **Translation Files**: ~22 files (11 en + 11 vi)
- **Components to Update**: ~11 components
- **Estimated Lines of Translation**: ~2000-3000 lines
- **Estimated Time**: 4-6 hours (if done systematically)

## 🎊 Final Deliverable

Một hệ thống admin hoàn chỉnh với đa ngôn ngữ English ↔ Tiếng Việt, cho phép admin chọn ngôn ngữ riêng biệt với client, với tất cả các trang, modal, toast, và form đều được dịch đầy đủ.
