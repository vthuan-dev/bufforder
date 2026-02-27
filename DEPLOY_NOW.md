# 🚀 DEPLOY NGAY - Hướng Dẫn Nhanh

## ⚡ Quick Start (5 phút)

### Bước 1: SSH vào VPS

```bash
ssh root@180.93.35.4
# Password: AZvps1l7m@du7@3
```

### Bước 2: Clone Repository

```bash
# Tạo thư mục
mkdir -p /var/www/greeting-message
cd /var/www/greeting-message

# Clone repository (THAY <your-github-repo-url> bằng URL repo của bạn)
git clone <your-github-repo-url> .

# Ví dụ:
# git clone https://github.com/yourusername/greeting-message.git .
```

### Bước 3: Chạy Script Deploy Tự Động

```bash
cd /var/www/greeting-message/scripts
chmod +x *.sh
bash deploy-all.sh
```

Script sẽ tự động:
- ✅ Cài đặt Node.js, MySQL, Nginx, PM2
- ✅ Setup database
- ✅ Deploy backend
- ✅ Build frontend
- ✅ Configure Nginx
- ✅ Configure firewall

### Bước 4: Truy Cập Application

Mở browser:
- **Frontend**: http://180.93.35.4
- **Admin**: http://180.93.35.4 → Click "Admin Login"
  - Username: `admin`
  - Password: `Admin@2024`

---

## 🔧 Deploy Thủ Công (Nếu cần)

### 1. SSH vào VPS
```bash
ssh root@180.93.35.4
```

### 2. Install Environment
```bash
cd /var/www/greeting-message/scripts
bash 1-install-environment.sh
```

### 3. Setup Database
```bash
bash 2-setup-database.sh
```

### 4. Deploy Backend
```bash
cd /var/www/greeting-message/backend
bash ../scripts/3-deploy-backend.sh
```

### 5. Deploy Frontend
```bash
cd /var/www/greeting-message/frontend
bash ../scripts/4-deploy-frontend.sh
```

### 6. Configure Nginx
```bash
bash /var/www/greeting-message/scripts/5-configure-nginx.sh
```

### 7. Configure Firewall
```bash
bash /var/www/greeting-message/scripts/6-configure-firewall.sh
```

---

## ✅ Kiểm Tra Sau Deploy

```bash
# Check backend
pm2 status
pm2 logs greeting-backend

# Check Nginx
systemctl status nginx

# Check firewall
ufw status

# Test API
curl http://localhost:5000/api/health
```

---

## 🐛 Nếu Có Lỗi

### Backend không start
```bash
pm2 logs greeting-backend --lines 50
pm2 restart greeting-backend
```

### Frontend không hiển thị
```bash
nginx -t
systemctl restart nginx
ls -la /var/www/greeting-message/frontend/build/
```

### Database connection error
```bash
mysql -u greeting_user -p greeting_message
# Password: Greeting@2024!Strong
```

---

## 📊 Monitoring

```bash
# Backend logs
pm2 logs greeting-backend

# Nginx logs
tail -f /var/log/nginx/error.log

# System resources
htop
```

---

## 🔄 Update Code

```bash
cd /var/www/greeting-message
git pull

# Update backend
cd backend
npm install
npx prisma migrate deploy
pm2 restart greeting-backend

# Update frontend
cd ../frontend
npm install
npm run build
systemctl restart nginx
```

---

## 📞 Thông Tin Quan Trọng

**VPS:**
- IP: 180.93.35.4
- User: root
- Password: AZvps1l7m@du7@3

**Database:**
- Name: greeting_message
- User: greeting_user
- Password: Greeting@2024!Strong

**Admin Account:**
- Username: admin
- Password: Admin@2024

**URLs:**
- Frontend: http://180.93.35.4
- API: http://180.93.35.4/api/health

---

## 🎯 Next Steps

1. ✅ Test tất cả features
2. ✅ Đổi admin password
3. ✅ Đổi JWT_SECRET trong backend/.env
4. ⚠️ Setup domain name (optional)
5. ⚠️ Setup SSL certificate (optional)
6. ⚠️ Setup database backups

---

## 🔐 Security Checklist

- [ ] Đổi admin password
- [ ] Đổi JWT_SECRET trong .env
- [ ] Đổi MySQL password
- [ ] Setup SSH key authentication
- [ ] Disable password SSH login
- [ ] Setup automatic backups
- [ ] Setup monitoring

---

**Chúc bạn deploy thành công! 🎉**
