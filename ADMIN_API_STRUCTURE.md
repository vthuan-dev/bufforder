# 🎯 Admin API Endpoints Structure

## 📋 Tổng Quan

Đã tổ chức lại tất cả API endpoints cho admin panel theo cấu trúc tabs trong giao diện. Mỗi tab có các endpoints riêng biệt và được phân loại rõ ràng.

## 🗂️ Cấu Trúc API Endpoints

### 📊 **Dashboard Tab** (`/admin/dashboard/...`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/admin/dashboard/stats` | GET | Lấy thống kê tổng quan dashboard |
| `/admin/dashboard/weekly-revenue` | GET | Dữ liệu doanh thu theo tuần |
| `/admin/dashboard/user-growth` | GET | Dữ liệu tăng trưởng users theo tháng |
| `/admin/dashboard/recent-users` | GET | Danh sách users mới nhất |
| `/admin/dashboard/download-report` | GET | Tải báo cáo dashboard |

**Frontend Functions:**
```typescript
api.adminGetDashboardStats()
api.adminGetWeeklyRevenue()
api.adminGetUserGrowth()
api.adminGetRecentUsers()
api.adminDownloadReport()
```

### 👥 **Users Tab** (`/admin/users/...`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/admin/users` | GET | Danh sách users với filter/pagination |
| `/admin/users/:id` | GET | Chi tiết user |
| `/admin/users/:id/status` | PATCH | Cập nhật trạng thái user |
| `/admin/users/:id/vip-level` | PATCH | Cập nhật VIP level |
| `/admin/users/stats` | GET | Thống kê users |

**Frontend Functions:**
```typescript
api.adminListUsers({ page, limit, q, status, vipLevel, sortBy, sortOrder })
api.adminGetUser(id)
api.adminUpdateUserStatus(id, status)
api.adminUpdateUserVipLevel(id, vipLevel)
api.adminGetUserStats()
```

### 💰 **Deposits Tab** (`/admin/deposits/...`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/admin/deposits` | GET | Danh sách deposit requests |
| `/admin/deposits/:id` | GET | Chi tiết deposit request |
| `/admin/deposits/:id/approve` | PATCH | Duyệt deposit |
| `/admin/deposits/:id/reject` | PATCH | Từ chối deposit |
| `/admin/deposits/stats` | GET | Thống kê deposits |

**Frontend Functions:**
```typescript
api.adminListDeposits({ page, limit, q, status, sortBy, sortOrder })
api.adminGetDeposit(id)
api.adminApproveDeposit(id)
api.adminRejectDeposit(id, reason)
api.adminGetDepositStats()
```

### 💸 **Withdrawals Tab** (`/admin/withdrawals/...`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/admin/withdrawals` | GET | Danh sách withdrawal requests |
| `/admin/withdrawals/:id` | GET | Chi tiết withdrawal request |
| `/admin/withdrawals/:id/approve` | PATCH | Duyệt withdrawal |
| `/admin/withdrawals/:id/reject` | PATCH | Từ chối withdrawal |
| `/admin/withdrawals/stats` | GET | Thống kê withdrawals |

**Frontend Functions:**
```typescript
api.adminListWithdrawals({ page, limit, q, status, sortBy, sortOrder })
api.adminGetWithdrawal(id)
api.adminApproveWithdrawal(id)
api.adminRejectWithdrawal(id, reason)
api.adminGetWithdrawalStats()
```

### 📦 **Orders Tab** (`/admin/orders/...`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/admin/orders` | GET | Danh sách orders |
| `/admin/orders/:id` | GET | Chi tiết order |
| `/admin/orders/:id/status` | PATCH | Cập nhật trạng thái order |
| `/admin/orders/stats` | GET | Thống kê orders |

**Frontend Functions:**
```typescript
api.adminListOrders({ page, limit, q, status, sortBy, sortOrder })
api.adminGetOrder(id)
api.adminUpdateOrderStatus(id, status)
api.adminGetOrderStats()
```

### 💬 **Chat Support Tab** (`/admin/chat/...`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/admin/chat/rooms` | GET | Danh sách chat rooms |
| `/admin/chat/rooms/:id/messages` | GET | Tin nhắn trong room |
| `/admin/chat/rooms/:id/messages` | POST | Gửi tin nhắn |
| `/admin/chat/stats` | GET | Thống kê chat |

**Frontend Functions:**
```typescript
api.adminGetChatRooms()
api.adminGetChatMessages(roomId, { page, limit })
api.adminSendChatMessage(roomId, message)
api.adminGetChatStats()
```

### ⚙️ **Settings Tab** (`/admin/settings/...`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/admin/profile` | GET | Thông tin profile admin |
| `/admin/profile` | PATCH | Cập nhật profile |
| `/admin/change-password` | POST | Đổi mật khẩu |
| `/admin/settings/system` | GET | Cài đặt hệ thống |
| `/admin/settings/system` | PATCH | Cập nhật cài đặt hệ thống |

**Frontend Functions:**
```typescript
api.adminGetProfile()
api.adminUpdateProfile(data)
api.adminChangePassword(currentPassword, newPassword)
api.adminGetSystemSettings()
api.adminUpdateSystemSettings(settings)
```

## 🔧 Query Parameters

### **Pagination & Filtering**
Tất cả list endpoints đều hỗ trợ:

```typescript
{
  page?: number;        // Trang hiện tại (default: 1)
  limit?: number;       // Số items per page (default: 20)
  q?: string;           // Search query
  status?: string;      // Filter by status
  sortBy?: string;      // Sort field
  sortOrder?: 'asc' | 'desc'; // Sort direction
}
```

### **Specific Filters**

**Users Tab:**
```typescript
{
  vipLevel?: string;    // Filter by VIP level
  status?: 'active' | 'inactive' | 'all';
}
```

**Deposits/Withdrawals Tab:**
```typescript
{
  status?: 'pending' | 'approved' | 'rejected' | 'all';
}
```

**Orders Tab:**
```typescript
{
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'all';
}
```

## 📊 Response Format

### **List Response**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 200
    }
  }
}
```

### **Single Item Response**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "field1": "value1",
    "field2": "value2"
  }
}
```

### **Stats Response**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "today": 10,
    "pending": 5,
    "trends": {
      "growth": 12.5
    }
  }
}
```

## 🔐 Authentication

Tất cả admin endpoints đều yêu cầu:
```typescript
Authorization: Bearer <admin_token>
```

## 🎨 Frontend Usage Examples

### **Dashboard Page**
```typescript
// Load dashboard data
const [stats, revenue, userGrowth, recentUsers] = await Promise.all([
  api.adminGetDashboardStats(),
  api.adminGetWeeklyRevenue(),
  api.adminGetUserGrowth(),
  api.adminGetRecentUsers()
]);
```

### **Users Page**
```typescript
// Load users with filters
const users = await api.adminListUsers({
  page: 1,
  limit: 20,
  q: searchQuery,
  status: statusFilter,
  vipLevel: vipFilter,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Update user status
await api.adminUpdateUserStatus(userId, 'active');
```

### **Deposits Page**
```typescript
// Load deposits
const deposits = await api.adminListDeposits({
  page: currentPage,
  status: 'pending'
});

// Approve deposit
await api.adminApproveDeposit(depositId);
```

### **Settings Page**
```typescript
// Load profile
const profile = await api.adminGetProfile();

// Update profile
await api.adminUpdateProfile({
  fullName: 'New Name',
  email: 'new@email.com'
});

// Change password
await api.adminChangePassword(currentPassword, newPassword);
```

## 🚀 Benefits

### **1. Organization**
- ✅ Endpoints được phân loại rõ ràng theo tabs
- ✅ Dễ dàng tìm kiếm và maintain
- ✅ Consistent naming convention

### **2. Scalability**
- ✅ Dễ dàng thêm endpoints mới cho từng tab
- ✅ Modular structure cho frontend components
- ✅ Clear separation of concerns

### **3. Developer Experience**
- ✅ TypeScript support với proper typing
- ✅ Consistent parameter patterns
- ✅ Comprehensive error handling

### **4. Frontend Integration**
- ✅ Mỗi tab có functions riêng biệt
- ✅ Reusable query parameters
- ✅ Easy to implement pagination và filtering

## 📝 Next Steps

1. **Backend Implementation**: Implement các endpoints mới trong backend
2. **Frontend Components**: Update các admin components để sử dụng APIs mới
3. **Testing**: Tạo test cases cho tất cả endpoints
4. **Documentation**: Tạo API documentation chi tiết
5. **Error Handling**: Implement comprehensive error handling

---

**🎉 Admin API Endpoints đã được tổ chức lại hoàn chỉnh theo cấu trúc tabs!** 📊✨
