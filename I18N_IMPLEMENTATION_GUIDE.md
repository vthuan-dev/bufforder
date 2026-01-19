# 🌍 i18n Implementation Guide

## ✅ Đã hoàn thành:

### 1. Cài đặt packages
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### 2. Cấu trúc thư mục
```
frontend/src/i18n/
├── index.ts                    # Config i18n
├── locales/
│   ├── en/
│   │   ├── common.json        # ✅ Done
│   │   └── withdrawal.json    # ✅ Done
│   └── vi/
│       ├── common.json        # ✅ Done
│       └── withdrawal.json    # ✅ Done
```

### 3. Components
- ✅ `LanguageSwitcher.tsx` - Component chuyển ngôn ngữ

---

## 📝 Cần làm tiếp:

### Bước 1: Import i18n vào App.tsx
```typescript
// frontend/src/App.tsx
import './i18n'; // Add this line at the top

// ... rest of code
```

### Bước 2: Thêm LanguageSwitcher vào MyPage
```typescript
// frontend/src/components/MyPage.tsx
import { LanguageSwitcher } from './LanguageSwitcher';

// Thêm vào header của MyPage:
<div className="flex items-center justify-between mb-8">
  <motion.div>
    {/* ... existing code ... */}
  </motion.div>
  <LanguageSwitcher />
</div>
```

### Bước 3: Update WithdrawalPage với i18n

**Thêm import:**
```typescript
import { useTranslation } from 'react-i18next';
```

**Thêm hook:**
```typescript
const { t } = useTranslation(['common', 'withdrawal']);
```

**Replace text:**
```typescript
// Trước:
<h1>Withdrawal</h1>

// Sau:
<h1>{t('withdrawal:title')}</h1>

// Trước:
<p className="text-sm opacity-90 mb-2">Available Balance</p>

// Sau:
<p className="text-sm opacity-90 mb-2">{t('withdrawal:availableBalance')}</p>

// Trước:
toast.error("Please enter a valid amount");

// Sau:
toast.error(t('withdrawal:toasts.enterAmount'));
```

---

## 🎯 Các trang cần update:

### Client Pages (Priority)
1. ✅ WithdrawalPage - Có translation file rồi
2. ⏳ MyPage - Cần tạo `my.json`
3. ⏳ HomePage - Cần tạo `home.json`
4. ⏳ OrdersPage - Cần tạo `orders.json`
5. ⏳ RecordPage - Cần tạo `record.json`
6. ⏳ HelpPage - Cần tạo `help.json`
7. ⏳ LoginPage - Cần tạo `auth.json`
8. ⏳ RegisterPage - Dùng chung `auth.json`
9. ⏳ WithdrawalMethodsPage - Cần tạo `withdrawalMethods.json`
10. ⏳ BankCardsTab - Dùng chung `withdrawalMethods.json`
11. ⏳ USDTWalletsTab - Dùng chung `withdrawalMethods.json`

### Admin Pages (Lower Priority)
- AdminDashboard
- AdminUsersPage
- AdminOrdersPage
- AdminChatPage
- AdminSettingsPage

---

## 📦 Template translation files cần tạo:

### my.json (MyPage)
```json
{
  "title": "My Profile",
  "vip": {
    "level": "VIP Level",
    "id": "ID"
  },
  "balance": {
    "available": "Available Balance",
    "freeze": "Freeze Balance"
  },
  "menu": {
    "shippingAddress": "Shipping Address",
    "topUp": "Top up",
    "withdrawal": "Withdrawal",
    "history": "Deposit and Withdrawal Records",
    "withdrawalMethods": "Withdrawal Methods",
    "securityCenter": "Security Center"
  },
  "notifications": {
    "title": "Notifications",
    "noNotifications": "No notifications yet",
    "markAsRead": "Mark as read",
    "clearAll": "Clear all"
  }
}
```

### home.json (HomePage)
```json
{
  "welcome": "Welcome",
  "vip": {
    "currentLevel": "Current VIP Level",
    "upgrade": "Upgrade VIP",
    "benefits": "VIP Benefits"
  },
  "balance": {
    "total": "Total Balance",
    "available": "Available",
    "frozen": "Frozen"
  },
  "tasks": {
    "daily": "Daily Tasks",
    "completed": "Completed",
    "remaining": "Remaining"
  },
  "quickActions": {
    "deposit": "Deposit",
    "withdraw": "Withdraw",
    "orders": "Orders"
  }
}
```

---

## 🚀 Cách sử dụng trong component:

### Basic Usage
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common', 'withdrawal']);
  
  return (
    <div>
      <h1>{t('withdrawal:title')}</h1>
      <button>{t('common:buttons.submit')}</button>
    </div>
  );
}
```

### With Variables
```typescript
// Translation file:
{
  "greeting": "Hello, {{name}}!"
}

// Component:
<p>{t('greeting', { name: 'John' })}</p>
// Output: "Hello, John!"
```

### With Plurals
```typescript
// Translation file:
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// Component:
<p>{t('items', { count: 5 })}</p>
// Output: "5 items"
```

---

## 🎨 Best Practices:

1. **Namespace theo trang**: Mỗi trang có file JSON riêng
2. **common.json**: Chứa text dùng chung (buttons, messages, nav)
3. **Nested keys**: Dùng nested object để organize tốt hơn
4. **Variables**: Dùng `{{variable}}` cho dynamic content
5. **Consistent naming**: Dùng camelCase cho keys

---

## 🧪 Testing:

1. Chạy app: `npm run dev`
2. Click vào LanguageSwitcher
3. Chuyển đổi giữa EN và VI
4. Check tất cả text đã được translate

---

## 📌 Next Steps:

1. Import `./i18n` vào `App.tsx`
2. Thêm `LanguageSwitcher` vào MyPage header
3. Update WithdrawalPage với `useTranslation`
4. Tạo translation files cho các trang còn lại
5. Update từng component với `t()` function
6. Test và fix bugs

---

## 💡 Tips:

- Dùng VS Code extension "i18n Ally" để quản lý translations dễ hơn
- Có thể dùng tool auto-extract text từ components
- Nên làm từng trang một, test kỹ trước khi chuyển sang trang khác
- Backup code trước khi bắt đầu refactor

