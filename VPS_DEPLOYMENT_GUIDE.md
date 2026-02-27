# 🚀 Hướng Dẫn Deploy VPS - Chi Tiết

## 📋 Thông Tin VPS

- **IP**: 180.93.35.4
- **Username**: root
- **Password**: AZvps1l7m@du7@3
- **Hostname**: azvps-1770482134

---

## 🔐 Bước 1: Kết Nối SSH

### Từ Windows (PowerShell hoặc CMD):
```powershell
ssh root@180.93.35.4
# Nhập password: AZvps1l7m@du7@3
```

### Từ Mac/Linux:
```bash
ssh root@180.93.35.4
# Nhập password: AZvps1l7m@du7@3
```

---

## 📦 Bước 2: Cài Đặt Môi Trường (Chạy trên VPS)

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install MySQL
apt install -y mysql-server

# Install Nginx
apt install -y nginx

# Install PM2 (Process Manager)
npm install -g pm2

# Install Git
apt install -y git

# Install other utilities
apt install -y curl wget nano htop
```

---

## 🗄️ Bước 3: Setup MySQL Database

```bash
# Start MySQL service
systemctl start mysql
systemctl enable mysql

# Secure MySQL installation
mysql_secure_installation
# - Set root password: chọn password mạnh
# - Remove anonymous users: Yes
# - Disallow root login remotely: Yes
# - Remove test database: Yes
# - Reload privilege tables: Yes

# Login to MySQL
mysql -u root -p

# Trong MySQL console, chạy:
CREATE DATABASE greeting_message CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'greeting_user'@'localhost' IDENTIFIED BY 'Greeting@2024!Strong';

GRANT ALL PRIVILEGES ON greeting_message.* TO 'greeting_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

---

## 📥 Bước 4: Clone Repository

```bash
# Create app directory
mkdir -p /var/www/greeting-message
cd /var/www/greeting-message

# Clone your GitHub repository
# Thay <your-github-repo-url> bằng URL repo của bạn
git clone <your-github-repo-url> .

# Example:
# git clone https://github.com/yourusername/greeting-message.git .

# Verify files
ls -la
```

---

## ⚙️ Bước 5: Configure Backend

```bash
cd /var/www/greeting-message/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Paste nội dung này vào .env:**
```env
# Database
DATABASE_URL="mysql://greeting_user:Greeting@2024!Strong@localhost:3306/greeting_message"

# JWT Secret (QUAN TRỌNG: Đổi thành chuỗi random)
JWT_SECRET="your_super_secret_jwt_key_min_32_characters_change_this"

# Server
PORT=5000

# Frontend URL (Thay bằng domain của bạn)
FRONTEND_URL="http://180.93.35.4"

# CORS (Thêm domain nếu có)
ALLOWED_ORIGINS=""
```

**Lưu file**: Ctrl+O, Enter, Ctrl+X

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Create admin account
node create-admin.js admin Admin@2024 admin@yourdomain.com "Admin User"

# Test backend
node server.js
# Nếu thấy "Server is running on port 5000" thì OK
# Nhấn Ctrl+C để dừng
```

---

## 🎨 Bước 6: Build Frontend

```bash
cd /var/www/greeting-message/frontend

# Install dependencies
npm install

# Create .env for production
nano .env
```

**Paste nội dung:**
```env
VITE_API_URL=http://180.93.35.4:5000
```

**Lưu file**: Ctrl+O, Enter, Ctrl+X

```bash
# Build for production
npm run build

# Verify build
ls -la build/
# Should see index.html and assets/
```

---

## 🚀 Bước 7: Start Backend với PM2

```bash
cd /var/www/greeting-message/backend

# Start with PM2
pm2 start server.js --name greeting-backend

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy và chạy command mà PM2 hiển thị

# Check status
pm2 status
pm2 logs greeting-backend
```

---

## 🌐 Bước 8: Configure Nginx

```bash
# Create Nginx config
nano /etc/nginx/sites-available/greeting-message
```

**Paste nội dung:**
```nginx
# Backend API
server {
    listen 5000;
    server_name 180.93.35.4;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}

# Frontend
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 180.93.35.4;

    root /var/www/greeting-message/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Lưu file**: Ctrl+O, Enter, Ctrl+X

```bash
# Remove default Nginx config
rm /etc/nginx/sites-enabled/default

# Enable site
ln -s /etc/nginx/sites-available/greeting-message /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

# Enable Nginx on boot
systemctl enable nginx
```

---

## 🔥 Bước 9: Configure Firewall

```bash
# Allow SSH (QUAN TRỌNG!)
ufw allow OpenSSH

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (for future SSL)
ufw allow 443/tcp

# Allow backend port (if needed)
ufw allow 5000/tcp

# Enable firewall
ufw enable
# Type 'y' to confirm

# Check status
ufw status
```

---

## ✅ Bước 10: Verify Deployment

```bash
# Check backend
pm2 status
pm2 logs greeting-backend --lines 20

# Check Nginx
systemctl status nginx

# Check if ports are listening
netstat -tulpn | grep :80
netstat -tulpn | grep :5000

# Test API
curl http://localhost:5000/api/health

# Test from outside
curl http://180.93.35.4/api/health
```

---

## 🌍 Bước 11: Access Application

Mở browser và truy cập:

- **Frontend**: http://180.93.35.4
- **API Health**: http://180.93.35.4/api/health
- **Admin Login**: http://180.93.35.4 → Click "Admin Login"

**Admin Credentials:**
- Username: `admin`
- Password: `Admin@2024`

---

## 🔧 Bước 12: Post-Deployment Tasks

### Update Frontend API URL (Nếu cần)

```bash
cd /var/www/greeting-message/frontend

# Edit api.ts
nano src/services/api.ts
```

Tìm dòng:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Đổi thành:
```typescript
const API_URL = 'http://180.93.35.4:5000';
```

Sau đó rebuild:
```bash
npm run build
systemctl restart nginx
```

---

## 📊 Monitoring Commands

```bash
# Backend logs
pm2 logs greeting-backend
pm2 monit

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System resources
htop
df -h
free -h

# Database
mysql -u greeting_user -p greeting_message
# Password: Greeting@2024!Strong
```

---

## 🔄 Update/Redeploy Commands

```bash
# Pull latest code
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

## 🐛 Troubleshooting

### Backend không start
```bash
pm2 logs greeting-backend --lines 50
pm2 restart greeting-backend
```

### Database connection error
```bash
# Test MySQL connection
mysql -u greeting_user -p greeting_message

# Check DATABASE_URL in .env
cat /var/www/greeting-message/backend/.env
```

### Frontend không load
```bash
# Check Nginx
nginx -t
systemctl restart nginx

# Check build files
ls -la /var/www/greeting-message/frontend/build/
```

### Port already in use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

---

## 🔐 Security Recommendations

1. **Change default passwords**
   - MySQL root password
   - Admin account password
   - JWT_SECRET in .env

2. **Setup SSH key authentication**
   ```bash
   # On your local machine
   ssh-keygen -t rsa -b 4096
   ssh-copy-id root@180.93.35.4
   ```

3. **Disable password authentication** (after SSH key setup)
   ```bash
   nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   systemctl restart sshd
   ```

4. **Setup automatic backups**
   ```bash
   # Create backup script
   nano /usr/local/bin/backup-db.sh
   ```

5. **Setup SSL certificate** (if you have domain)
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com
   ```

---

## 📞 Quick Reference

**VPS Info:**
- IP: 180.93.35.4
- SSH: `ssh root@180.93.35.4`
- App Dir: `/var/www/greeting-message`

**Services:**
- Backend: PM2 (port 5000)
- Frontend: Nginx (port 80)
- Database: MySQL (port 3306)

**Commands:**
```bash
# Restart backend
pm2 restart greeting-backend

# Restart Nginx
systemctl restart nginx

# Restart MySQL
systemctl restart mysql

# View logs
pm2 logs greeting-backend
tail -f /var/log/nginx/error.log
```

---

## ✅ Deployment Checklist

- [ ] SSH vào VPS thành công
- [ ] Cài đặt Node.js, MySQL, Nginx, PM2
- [ ] Setup MySQL database
- [ ] Clone repository
- [ ] Configure backend .env
- [ ] Run Prisma migrations
- [ ] Create admin account
- [ ] Build frontend
- [ ] Configure Nginx
- [ ] Start backend với PM2
- [ ] Configure firewall
- [ ] Test application
- [ ] Change default passwords
- [ ] Setup monitoring

---

## 🎉 Done!

Application của bạn đã được deploy thành công!

**Access:**
- Frontend: http://180.93.35.4
- Admin: http://180.93.35.4 (click Admin Login)

**Next Steps:**
1. Test tất cả features
2. Setup domain name (optional)
3. Setup SSL certificate (optional)
4. Configure backups
5. Setup monitoring

---

**Good luck! 🚀**
