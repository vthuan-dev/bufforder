# Admin Notification Persistence Fix

## Vấn đề
Thông báo deposit/withdrawal hiện lên realtime (qua Socket.IO) nhưng không lưu vào database, chỉ lưu trong localStorage. Khi refresh page hoặc đăng nhập lại → mất hết thông báo.

## Giải pháp Đơn Giản (Không cần DB mới)

Thay vì tạo table AdminNotification mới, chúng ta sử dụng dữ liệu đã có sẵn:
- Load pending DepositRequests từ DB
- Load pending WithdrawalRequests từ DB
- Hiển thị chúng như thông báo trong notification bell
- Khi admin approve/reject → request không còn pending → tự động biến mất khỏi list

## Thay đổi

### File: `frontend/src/components/admin/AdminLayout.tsx`

#### 1. Load Pending Requests khi Component Mount

Thêm logic load pending requests trong `initData()` function (dòng ~350):

```typescript
// 💰 Load pending deposit requests as notifications
try {
  const depositRes = await api.adminListDepositRequests({ status: 'pending', page: 1, limit: 50 });
  const pendingDeposits = (depositRes?.data?.requests || []).map((req: any) => ({
    id: `deposit-${req.id}`,
    requestId: req.id,
    userName: req.user?.fullName || 'Unknown',
    amount: req.amount,
    createdAt: new Date(req.requestDate),
    isRead: false
  }));
  
  // Merge with existing localStorage notifications (avoid duplicates)
  setDepositNotifications(prev => {
    const existingIds = new Set(prev.map(n => n.requestId));
    const newNotifications = pendingDeposits.filter((n: any) => !existingIds.has(n.requestId));
    const merged = [...newNotifications, ...prev].slice(0, 50);
    try { localStorage.setItem('admin:depositNotifications', JSON.stringify(merged)); } catch { }
    return merged;
  });
} catch (e) {
  console.error('[AdminLayout] Failed to load pending deposits:', e);
}

// 💸 Load pending withdrawal requests as notifications
try {
  const withdrawalRes = await api.adminListWithdrawalRequests({ status: 'pending', page: 1, limit: 50 });
  const pendingWithdrawals = (withdrawalRes?.data?.requests || []).map((req: any) => ({
    id: `withdrawal-${req.id}`,
    requestId: req.id,
    userName: req.user?.fullName || 'Unknown',
    amount: req.amount,
    withdrawalType: req.withdrawalType || 'bank',
    createdAt: new Date(req.requestDate),
    isRead: false
  }));
  
  // Merge with existing localStorage notifications (avoid duplicates)
  setWithdrawalNotifications(prev => {
    const existingIds = new Set(prev.map(n => n.requestId));
    const newNotifications = pendingWithdrawals.filter((n: any) => !existingIds.has(n.requestId));
    const merged = [...newNotifications, ...prev].slice(0, 50);
    try { localStorage.setItem('admin:withdrawalNotifications', JSON.stringify(merged)); } catch { }
    return merged;
  });
} catch (e) {
  console.error('[AdminLayout] Failed to load pending withdrawals:', e);
}
```

#### 2. Hiển thị Deposit Notifications trong Dropdown

Thêm section hiển thị deposit notifications trong notification dropdown (dòng ~810):

```typescript
{/* Deposit Notifications */}
{depositNotifications.length > 0 && (
  <>
    <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
      Deposits ({unreadDepositCount} new)
    </div>
    {depositNotifications.slice(0, 5).map((notification) => (
      <DropdownMenuItem
        key={notification.id}
        className="flex flex-col items-start gap-1 py-3 cursor-pointer"
        onClick={() => onNavigate('deposits')}
      >
        <div className="flex items-center gap-2 w-full">
          {!notification.isRead && (
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
          )}
          <ArrowDownCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className={`font-medium text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
            New Deposit Request
          </span>
        </div>
        <p className="text-xs text-gray-500 pl-6">
          {notification.userName}
        </p>
        <div className="flex items-center justify-between w-full pl-6">
          <span className="text-xs text-green-600 font-medium">
            ${notification.amount.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
      </DropdownMenuItem>
    ))}
  </>
)}
```

#### 3. Sắp xếp lại thứ tự hiển thị

Thay đổi thứ tự hiển thị trong dropdown:
1. **Deposits** (quan trọng nhất - tiền vào)
2. **Withdrawals** (quan trọng thứ 2 - tiền ra)
3. **Orders** (ít quan trọng hơn)

## Cách hoạt động

### Khi Admin đăng nhập:
1. Load tất cả pending deposit requests từ DB
2. Load tất cả pending withdrawal requests từ DB
3. Merge với localStorage (tránh duplicate)
4. Hiển thị trong notification bell

### Khi có request mới:
1. Socket.IO emit event realtime
2. Frontend nhận event → thêm vào list
3. Play sound + show toast
4. Lưu vào localStorage

### Khi Admin approve/reject:
1. Request status thay đổi từ "pending" → "approved"/"rejected"
2. Lần sau load lại → request không còn pending → không hiển thị nữa
3. Notification tự động "biến mất"

### Khi refresh page:
1. Load lại pending requests từ DB
2. Thông báo vẫn còn đó!

## Ưu điểm

✅ **Không cần migration DB** - Sử dụng tables có sẵn
✅ **Đơn giản** - Chỉ thêm ~50 dòng code
✅ **Tự động cleanup** - Khi approve/reject, notification tự biến mất
✅ **Backward compatible** - Không ảnh hưởng code cũ
✅ **Realtime vẫn hoạt động** - Socket.IO events không thay đổi

## Testing

### Test 1: Load notifications khi đăng nhập
1. Tạo vài deposit/withdrawal requests (status = pending)
2. Đăng nhập admin
3. Mở notification bell → Thấy tất cả pending requests

### Test 2: Realtime notification
1. Đăng nhập admin
2. Từ user account, tạo deposit request mới
3. Admin thấy toast notification ngay lập tức
4. Mở bell → Thấy notification mới

### Test 3: Persistence sau refresh
1. Có notifications trong bell
2. Refresh page (F5)
3. Mở bell → Notifications vẫn còn đó

### Test 4: Auto cleanup
1. Có deposit notification trong bell
2. Approve deposit request
3. Refresh page
4. Mở bell → Notification đã biến mất (vì không còn pending)

## Notes

- Notifications được merge giữa DB và localStorage để tránh duplicate
- Giới hạn 50 notifications mỗi loại
- Thứ tự ưu tiên: Deposits > Withdrawals > Orders
- Khi click notification → Navigate đến trang tương ứng
