# Session Management Fix - Giải quyết vấn đề bị logout liên tục

## Vấn đề
Client bị logout ra trang login liên tục, đặc biệt khi:
- Mạng chậm hoặc không ổn định
- Server phản hồi chậm
- Có nhiều request đồng thời
- Token validation timeout

## Nguyên nhân

### 1. Token Validation Quá Nghiêm Ngặt
- **Trước**: Mỗi khi component mount, app gọi API để validate token với timeout 5 giây
- **Vấn đề**: Nếu API chậm hoặc timeout, user bị logout ngay lập tức
- **Kết quả**: User bị logout không cần thiết khi mạng chậm

### 2. Request Timeout Quá Ngắn
- **Trước**: Timeout 15 giây cho tất cả requests
- **Vấn đề**: Với server chậm hoặc mạng kém, requests bị timeout và trả về lỗi
- **Kết quả**: 401 errors không cần thiết → logout

### 3. Xử lý 401 Quá Nhanh
- **Trước**: Ngay khi nhận 401, clear token và redirect ngay lập tức
- **Vấn đề**: Nhiều requests đồng thời có thể gây race condition
- **Kết quả**: Multiple redirects, clear storage nhiều lần

### 4. Không Có Token Expiry Tracking
- **Trước**: Không theo dõi khi nào token được tạo
- **Vấn đề**: Không biết token còn bao lâu hết hạn (7 ngày)
- **Kết quả**: User bị logout đột ngột khi token hết hạn

## Giải pháp

### 1. ✅ Optimistic Authentication (App.tsx)
```typescript
// Assume token is valid until proven otherwise
setIsAuthenticated(true);

// Increased timeout to 15 seconds
signal: AbortSignal.timeout(15000)

// Only logout on explicit 401/403
if (res.status === 401 || res.status === 403) {
  // Logout
} else {
  // Keep session even on network errors
}
```

**Lợi ích**:
- User không bị logout khi mạng chậm
- Trải nghiệm mượt mà hơn
- Chỉ logout khi thực sự unauthorized

### 2. ✅ Increased Request Timeout (api.ts)
```typescript
// Increased from 15s to 30s
const timeoutId = setTimeout(() => controller.abort(), 30000);
```

**Lợi ích**:
- Cho phép server có thời gian xử lý
- Giảm timeout errors trên mạng chậm
- Tương thích với VPS/production servers

### 3. ✅ Delayed 401 Handling (api.ts)
```typescript
setTimeout(() => {
  // Clear storage and redirect
  localStorage.removeItem('token');
  localStorage.removeItem('tokenTimestamp');
  window.location.replace('/login');
}, 100); // Small delay prevents race conditions
```

**Lợi ích**:
- Tránh multiple redirects
- Cho phép pending requests hoàn thành
- Cleanup sạch sẽ hơn

### 4. ✅ Token Expiry Tracking (api.ts)
```typescript
// Save timestamp when login/register
localStorage.setItem('tokenTimestamp', String(Date.now()));

// Utility functions
isTokenExpiringSoon(): boolean // Check if < 1 day remaining
getTokenAgeDays(): number // Get token age in days
```

**Lợi ích**:
- Biết được token còn bao lâu hết hạn
- Có thể cảnh báo user trước khi hết hạn
- Có thể implement auto-refresh trong tương lai

## Cấu hình Token

### Backend (backend/routes/auth.js)
```javascript
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { 
    expiresIn: '7d' // Token valid for 7 days
  });
};
```

### Token Lifecycle
1. **Login/Register**: Token được tạo với expiry 7 ngày
2. **Storage**: Token + timestamp được lưu trong localStorage
3. **Validation**: Mỗi request gửi token trong Authorization header
4. **Expiry**: Sau 7 ngày, backend trả về 401 → user phải login lại

## Best Practices

### 1. Khi nào logout user?
✅ **NÊN logout**:
- 401 Unauthorized (token invalid/expired)
- 403 Forbidden (no permission)
- User clicks logout button

❌ **KHÔNG NÊN logout**:
- Network timeout
- Server error (500, 502, 503)
- Slow response
- Temporary connection issues

### 2. Error Handling Strategy
```typescript
try {
  const response = await api.someEndpoint();
} catch (error) {
  if (error.message.includes('Session expired')) {
    // Already handled by api.ts - user redirected to login
  } else if (error.message.includes('timeout')) {
    // Show retry option, don't logout
    toast.error('Connection timeout. Please try again.');
  } else {
    // Show error, keep session
    toast.error(error.message);
  }
}
```

### 3. Token Refresh (Future Enhancement)
Để tránh user phải login lại sau 7 ngày, có thể implement:
```typescript
// Check token age on app load
if (api.getTokenAgeDays() >= 6) {
  // Token expires in < 1 day
  // Call refresh endpoint to get new token
  const newToken = await api.refreshToken();
  localStorage.setItem('token', newToken);
  localStorage.setItem('tokenTimestamp', String(Date.now()));
}
```

## Testing

### Test Cases
1. ✅ **Slow Network**: User không bị logout khi mạng chậm
2. ✅ **Server Timeout**: User không bị logout khi server chậm
3. ✅ **Invalid Token**: User bị logout khi token thực sự invalid
4. ✅ **Token Expired**: User bị logout khi token hết hạn (sau 7 ngày)
5. ✅ **Multiple Requests**: Không có race conditions khi nhiều requests đồng thời

### Manual Testing
```bash
# 1. Test slow network
# - Throttle network in DevTools (Slow 3G)
# - Navigate between pages
# - Verify: User stays logged in

# 2. Test server timeout
# - Stop backend server temporarily
# - Try to load a page
# - Verify: User sees error but stays logged in

# 3. Test invalid token
# - Manually edit token in localStorage to invalid value
# - Refresh page
# - Verify: User is logged out

# 4. Test token expiry
# - Set tokenTimestamp to 8 days ago
# - Refresh page
# - Verify: Backend returns 401, user is logged out
```

## Monitoring

### Console Logs
```typescript
// Auth validation
[Auth] Token validated successfully
[Auth] Token invalid (401/403), logging out
[Auth] Validation error (keeping session): timeout

// API requests
[API] 401 Unauthorized: /api/orders/stats
[Cache Hit] GET:/api/products
```

### Token Age Check
```typescript
// In browser console
console.log('Token age:', api.getTokenAgeDays(), 'days');
console.log('Expiring soon?', api.isTokenExpiringSoon());
```

## Kết quả

### Trước khi fix
- ❌ User bị logout liên tục khi mạng chậm
- ❌ Timeout errors gây logout không cần thiết
- ❌ Race conditions với multiple 401s
- ❌ Không biết token còn bao lâu hết hạn

### Sau khi fix
- ✅ User chỉ logout khi thực sự unauthorized
- ✅ Timeout tăng lên 30s cho mạng chậm
- ✅ Delayed 401 handling tránh race conditions
- ✅ Track token age và expiry
- ✅ Trải nghiệm người dùng mượt mà hơn

## Files Changed

1. **frontend/src/App.tsx**
   - Optimistic authentication
   - Increased validation timeout to 15s
   - Better error handling

2. **frontend/src/services/api.ts**
   - Increased request timeout to 30s
   - Delayed 401 handling (100ms)
   - Token timestamp tracking
   - Utility functions: `isTokenExpiringSoon()`, `getTokenAgeDays()`
   - Clear tokenTimestamp on logout

## Recommendations

### Short-term
1. ✅ Monitor console logs for 401 errors
2. ✅ Test on slow networks (3G, 4G)
3. ✅ Verify no unexpected logouts

### Long-term
1. 🔄 Implement token refresh mechanism
2. 🔄 Add token expiry warning (e.g., "Your session expires in 1 day")
3. 🔄 Consider increasing token expiry to 30 days for better UX
4. 🔄 Add "Remember me" option for longer sessions

## Support

Nếu vẫn gặp vấn đề logout:
1. Check console logs cho error messages
2. Verify token age: `api.getTokenAgeDays()`
3. Check network tab trong DevTools
4. Verify backend server đang chạy và phản hồi nhanh
