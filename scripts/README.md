# 🚀 Deployment Scripts

Các script tự động để deploy dự án lên VPS.

## 📋 Thứ Tự Chạy

### Option 1: Deploy Tất Cả (Recommended)

```bash
# 1. SSH vào VPS
ssh root@180.93.35.4

# 2. Clone repository
mkdir -p /var/www/greeting-message
cd /var/www/greeting-message
git clone <your-github-repo-url> .

# 3. Chạy script deploy tất cả
cd scripts
chmod +x *.sh
bash deploy-all.sh
```

### Option 2: Deploy Từng Bước

```bash
# SSH vào VPS
ssh root@180.93.35.4

# Clone repository
mkdir -p /var/www/greeting-message
cd /var/www/greeting-message
git clone <your-github-repo-url> .

# Chạy từng script
cd scripts
chmod +x *.sh

# 1. Install environment
bash 1-install-environment.sh

# 2. Setup database
bash 2-setup-database.sh

# 3. Deploy backend
cd /var/www/greeting-message/backend
bash ../scripts/3-deploy-backend.sh

# 4. Deploy frontend
cd /var/www/greeting-message/frontend
bash ../scripts/4-deploy-frontend.sh

# 5. Configure Nginx
bash /var/www/greeting-message/scripts/5-configure-nginx.sh

# 6. Configure firewall
bash /var/www/greeting-message/scripts/6-configure-firewall.sh
```

## 📝 Chi Tiết Các Script

### 1-install-environment.sh
- Update system packages
- Install Node.js 18.x
- Install MySQL
- Install Nginx
- Install PM2
- Install Git và utilities

### 2-setup-database.sh
- Start MySQL service
- Create database `greeting_message`
- Create user `greeting_user`
- Grant privileges

### 3-deploy-backend.sh
- Install npm dependencies
- Create .env file
- Generate Prisma Client
- Run database migrations
- Create admin account
- Start backend với PM2

### 4-deploy-frontend.sh
- Install npm dependencies
- Create .env file
- Build for production
- Verify build output

### 5-configure-nginx.sh
- Create Nginx configuration
- Enable site
- Test configuration
- Restart Nginx

### 6-configure-firewall.sh
- Configure UFW firewall
- Allow SSH, HTTP, HTTPS
- Enable firewall

### deploy-all.sh
- Chạy tất cả các script trên theo thứ tự
- Full automated deployment

## 🔧 Sau Khi Deploy

### Kiểm Tra Status
```bash
# Backend
pm2 status
pm2 logs greeting-backend

# Nginx
systemctl status nginx

# Firewall
ufw status
```

### Access Application
- Frontend: http://180.93.35.4
- API: http://180.93.35.4/api/health
- Admin: http://180.93.35.4 (click Admin Login)

### Admin Credentials
- Username: `admin`
- Password: `Admin@2024`

## 🔄 Update/Redeploy

```bash
cd /var/www/greeting-message

# Pull latest code
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

## 🐛 Troubleshooting

### Backend không start
```bash
pm2 logs greeting-backend --lines 50
pm2 restart greeting-backend
```

### Frontend không load
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

## 📞 Support

Nếu gặp vấn đề, check:
1. PM2 logs: `pm2 logs greeting-backend`
2. Nginx logs: `tail -f /var/log/nginx/error.log`
3. System logs: `journalctl -xe`
