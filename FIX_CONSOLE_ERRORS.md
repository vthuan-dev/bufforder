# Fix Console Errors - Hướng dẫn

## Lỗi trong ảnh:

1. ❌ "Uncaught (in promise) inner: Could not establish connection. content-script-jcs:3"
2. ❌ "Failed to load module script: Expected a JavaScript or WASM module..."

## Nguyên nhân:

### Lỗi 1: Browser Extension
- Đây là lỗi từ **browser extension** (có thể là ad blocker, translator, etc.)
- Extension đang cố inject script vào trang nhưng bị lỗi
- **KHÔNG ảnh hưởng đến app của bạn**

### Lỗi 2: Module Loading
- Có thể do **cache cũ** của browser
- Hoặc **build artifacts** cũ chưa được clear

## ✅ Cách fix:

### Bước 1: Clear cache và rebuild

```bash
# Terminal 1: Stop frontend nếu đang chạy (Ctrl+C)

# Clear cache và rebuild
cd frontend
rmdir /s /q node_modules\.vite
rmdir /s /q build
npm run build

# Start lại
npm run dev
```

### Bước 2: Hard refresh browser

1. Mở trang web
2. Nhấn **Ctrl + Shift + R** (Windows) hoặc **Cmd + Shift + R** (Mac)
3. Hoặc mở DevTools → Right click vào nút Refresh → **Empty Cache and Hard Reload**

### Bước 3: Disable browser extensions (test)

1. Mở **Incognito/Private mode** (Ctrl + Shift + N)
2. Test app trong incognito
3. Nếu không còn lỗi → lỗi do extension

### Bước 4: Check backend

```bash
# Terminal 2: Restart backend
cd backend
# Stop (Ctrl+C) và start lại
node server.js
```

## 🔍 Kiểm tra GPS có hoạt động không:

Mở Console và chạy:

```javascript
// Test GPS
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('✅ GPS OK:', pos.coords),
  (err) => console.error('❌ GPS Error:', err),
  { enableHighAccuracy: true }
);
```

Nếu thấy "✅ GPS OK" → GPS đang hoạt động bình thường!

## 🎯 Nếu vẫn còn lỗi:

### Check network tab:
1. Mở DevTools → Network tab
2. Reload trang
3. Tìm request màu đỏ (failed)
4. Click vào xem chi tiết lỗi

### Check console filters:
1. Console tab → Click vào filter icon
2. Uncheck "Hide network" và "Hide extension errors"
3. Xem lỗi thực sự từ app hay từ extension

## 📝 Lưu ý:

- Lỗi "content-script-jcs" là từ **extension**, không phải app
- Lỗi "module script" có thể do **cache**, clear là xong
- GPS code đã được implement đúng, chỉ cần test thôi!

## 🚀 Quick fix commands:

```bash
# Frontend
cd frontend
rmdir /s /q node_modules\.vite
npm run dev

# Browser
# Ctrl + Shift + R (hard refresh)
```

Sau đó test lại nhé! 🎯
