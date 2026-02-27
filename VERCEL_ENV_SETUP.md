# Cấu hình Environment Variables trên Vercel

## Vấn đề hiện tại
Frontend đã deploy lên Vercel (https://bufforder.vercel.app) nhưng chưa biết địa chỉ backend API.

## Giải pháp

### Bước 1: Thêm Environment Variable trên Vercel

1. Truy cập Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project `bufforder`
3. Vào tab **Settings** → **Environment Variables**
4. Thêm biến môi trường mới:

```
Name: VITE_API_BASE_URL
Value: http://180.93.35.4:5000
```

5. Chọn áp dụng cho:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. Click **Save**

### Bước 2: Redeploy ứng dụng

Sau khi thêm environment variable, bạn cần redeploy:

**Cách 1: Redeploy từ Vercel Dashboard**
1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click nút **⋯** (3 chấm) → **Redeploy**
4. Chọn **Redeploy** để xác nhận

**Cách 2: Push code mới lên GitHub**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### Bước 3: Kiểm tra

Sau khi redeploy xong (khoảng 1-2 phút):

1. Truy cập: https://bufforder.vercel.app
2. Mở Developer Console (F12)
3. Thử đăng nhập hoặc đăng ký
4. Kiểm tra tab **Network** xem API calls có gọi đến `http://180.93.35.4:5000` không

## Cấu trúc hiện tại

### Backend (.env)
```env
ALLOWED_ORIGINS=""
```
✅ Backend đã cấu hình cho phép tất cả domain `*.vercel.app` trong code

### Frontend (api.ts)
```typescript
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
```
✅ Frontend đã sẵn sàng đọc từ environment variable

## Lưu ý quan trọng

1. **CORS đã được cấu hình sẵn**: Backend đã cho phép tất cả domain `*.vercel.app`
2. **Không cần sửa code**: Chỉ cần thêm env var trên Vercel
3. **HTTP vs HTTPS**: Hiện tại backend dùng HTTP (không SSL). Nếu muốn HTTPS, cần cấu hình SSL certificate cho VPS

## Kiểm tra lỗi

Nếu vẫn gặp lỗi sau khi redeploy:

1. **CORS Error**: Kiểm tra backend logs
   ```bash
   ssh root@180.93.35.4
   pm2 logs greeting-backend
   ```

2. **Connection refused**: Kiểm tra backend có đang chạy không
   ```bash
   pm2 status
   curl http://localhost:5000/api/health
   ```

3. **Environment variable không load**: Kiểm tra trong Vercel build logs
   - Vào tab **Deployments** → Click vào deployment → Xem **Build Logs**
   - Tìm dòng có `VITE_API_BASE_URL`

## Kết quả mong đợi

Sau khi hoàn thành:
- ✅ Frontend trên Vercel kết nối được với Backend trên VPS
- ✅ Đăng nhập/đăng ký hoạt động bình thường
- ✅ Chat real-time qua Socket.IO hoạt động
- ✅ Tất cả API calls đều gọi đến `http://180.93.35.4:5000`
