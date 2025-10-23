# 🔧 Chat Fix - Messages Disappearing Issue

## 🔴 Vấn đề ban đầu

Khi admin chat với client:
1. ✅ Đoạn chat hoạt động bình thường
2. ❌ Khi client chuyển sang tab khác rồi quay lại → **tin nhắn biến mất**
3. ✅ Admin vẫn còn toàn bộ tin nhắn

## 🔍 Nguyên nhân

### 1. LocalStorage bị xóa khi unmount
```typescript
// TRƯỚC (SAI)
return () => {
  try { localStorage.removeItem('client:activeThreadId'); } catch {}
  socketRef.current?.disconnect();
};
```

Khi user chuyển tab → React unmount component → xóa `client:activeThreadId` → mất thread ID → không load được lịch sử chat.

### 2. Socket không tự động reconnect đúng cách
Không có logic xử lý khi socket reconnect sau khi bị disconnect.

### 3. Logic sound notification bị lỗi
Điều kiện `if (isFocused)` sai → chơi âm thanh khi đang focus tab (ngược lại với mong muốn).

## ✅ Giải pháp đã áp dụng

### 1. **Tách localStorage keys rõ ràng**
- `client:threadId` - Lưu vĩnh viễn thread ID (KHÔNG xóa khi unmount)
- `client:activeThreadId` - Đánh dấu thread đang active (xóa khi unmount để notification hoạt động đúng)

### 2. **Thêm socket reconnection handler**
```typescript
s.on('connect', () => {
  console.log('[socket] connected, joining thread:', threadIdRef.current);
  if (threadIdRef.current) {
    s.emit('chat:joinThread', threadIdRef.current);
    try { localStorage.setItem('client:activeThreadId', String(threadIdRef.current)); } catch {}
  }
});
```

### 3. **Sửa logic sound notification**
```typescript
// Chỉ phát âm thanh khi TAB KHÔNG được focus
if (!isFocused) {  // ← Đổi từ isFocused thành !isFocused
  console.log('[client] Playing notification sound');
  playNoti();
}
```

### 4. **Cleanup đúng cách**
```typescript
return () => {
  // GIỮ threadId để lần sau load lại
  // CHỈ xóa activeThreadId để notification hoạt động đúng
  try { localStorage.removeItem('client:activeThreadId'); } catch {}
  socketRef.current?.disconnect();
};
```

## 📝 Flow hoạt động mới

### Lần đầu vào chat:
1. Check `localStorage.getItem('client:threadId')` → null
2. Gọi `api.chatOpenThread()` → server trả về threadId
3. Load messages từ threadId
4. Lưu `localStorage.setItem('client:threadId', threadId)`
5. Connect socket và join thread

### Chuyển tab rồi quay lại:
1. Component unmount → xóa `client:activeThreadId`, GIỮ `client:threadId`
2. Component mount lại → đọc `client:threadId` từ localStorage
3. Load messages từ threadId (✅ có lịch sử chat)
4. Socket reconnect → auto join lại thread
5. Lưu lại `client:activeThreadId`

### Khi nhận tin nhắn từ admin:
- Tab đang focus → KHÔNG phát âm thanh
- Tab không focus → PHÁT âm thanh notification

## 🧪 Test cases

### ✅ Test 1: Chat bình thường
1. Admin gửi tin nhắn
2. Client nhận được tin nhắn
3. ✅ PASS

### ✅ Test 2: Chuyển tab và quay lại
1. Admin gửi tin nhắn
2. Client nhận được tin nhắn
3. Client chuyển sang tab khác
4. Client quay lại tab chat
5. ✅ Tin nhắn vẫn còn (FIXED!)

### ✅ Test 3: Socket reconnection
1. Ngắt mạng
2. Kết nối lại
3. ✅ Auto rejoin thread và sync messages

### ✅ Test 4: Sound notification
1. Client đang focus tab chat → admin gửi tin → ❌ KHÔNG phát âm thanh (đúng)
2. Client focus tab khác → admin gửi tin → ✅ PHÁT âm thanh (đúng)

## 📂 Files đã sửa

- `frontend/src/components/HelpPage.tsx` - Component chat của client

## 🔄 Backend không cần thay đổi

Backend đã xử lý đúng:
- API `/api/chat/thread` luôn trả về thread mới nhất của user
- API `/api/chat/thread/:id/messages` trả về đầy đủ lịch sử tin nhắn
- Socket.io broadcast tin nhắn đến đúng rooms

## 🚀 Deploy

1. Build lại frontend:
```bash
cd frontend
npm run build
```

2. Deploy như bình thường (không cần thay đổi backend)

## 📌 Notes quan trọng

1. **KHÔNG bao giờ xóa `client:threadId`** trừ khi user logout hoàn toàn
2. Chỉ xóa `client:activeThreadId` khi unmount để notification system hoạt động đúng
3. Socket.io tự động reconnect, nhưng phải có handler để rejoin thread
4. Sound notification chỉ chơi khi tab KHÔNG được focus

## ✨ Kết quả

- ✅ Tin nhắn KHÔNG bị mất khi chuyển tab
- ✅ Socket tự động reconnect
- ✅ Sound notification hoạt động đúng
- ✅ User experience mượt mà hơn
