# 📋 Copy-Paste Commands - Deploy VPS

Bạn đã SSH vào VPS thành công! Bây giờ copy-paste từng section dưới đây vào terminal.

---

## 🔴 QUAN TRỌNG: Thay URL Repository

Trước khi bắt đầu, chuẩn bị URL GitHub repository của bạn:
```
https://github.com/yourusername/greeting-message.git
```

---

## 📦 SECTION 1: Update & Install Environment

Copy toàn bộ đoạn này và paste vào terminal:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
echo "Node version:" && node --version
echo "NPM version:" && npm --version

# Install MySQL
apt install -y mysql-server

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2

# Install utilities
apt install -y git curl wget nano htop unzip

echo "✅ Section 1 Complete!"
```

**Đợi cho đến khi thấy "✅ Section 1 Complete!"**

---

## 🗄️ SECTION 2: Setup MySQL Database

Copy và paste:

```bash
# Start MySQL
systemctl start mysql
systemctl enable mysql

# Create database and user
mysql -u root << 'MYSQL_SCRIPT'
CREATE DATABASE IF NOT EXISTS greeting_message CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'greeting_user'@'localhost' IDENTIFIED BY 'Greeting@2024!Strong';
GRANT ALL PRIVILEGES ON greeting_message.* TO 'greeting_user'@'localhost';
FLUSH PRIVILEGES;
SELECT User, Host FROM mysql.user WHERE User = 'greeting_user';
MYSQL_SCRIPT

echo "✅ Section 2 Complete - Database created!"
```

**Đợi cho đến khi thấy "✅ Section 2 Complete!"**

---

## 📥 SECTION 3: Clone Repository

⚠️ **THAY `<YOUR_GITHUB_REPO_URL>` BẰNG URL REPO CỦA BẠN!**

```bash
# Create directory
mkdir -p /var/www/greeting-message
cd /var/www/greeting-message

# Clone repository - THAY URL NÀY!
git clone <YOUR_GITHUB_REPO_URL> .

# Example:
# git clone https://github.com/yourusername/greeting-message.git .

# Verify
ls -la

echo "✅ Section 3 Complete - Repository cloned!"
```

**Kiểm tra xem có thấy các thư mục: backend, frontend, scripts**

---

## 🔧 SECTION 4: Deploy Backend

Copy và paste:

```bash
cd /var/www/greeting-message/backend

# Install dependencies
npm install --production

# Create .env file with random JWT secret
JWT_SECRET=$(openssl rand -base64 32)
cat > .env << ENV_FILE
DATABASE_URL="mysql://greeting_user:Greeting@2024!Strong@localhost:3306/greeting_message"
JWT_SECRET="$JWT_SECRET"
PORT=5000
FRONTEND_URL="http://180.93.35.4"
ALLOWED_ORIGINS=""
ENV_FILE

echo "JWT_SECRET generated: $JWT_SECRET"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create admin account
node create-admin.js admin Admin@2024 admin@example.com "Admin User" || echo "Admin might already exist"

# Start with PM2
pm2 delete greeting-backend 2>/dev/null || true
pm2 start server.js --name greeting-backend
pm2 save
pm2 startup

echo "✅ Section 4 Complete - Backend deployed!"
pm2 status
```

**Đợi và kiểm tra PM2 status - phải thấy "online"**

---

## 🎨 SECTION 5: Deploy Frontend

Copy và paste:

```bash
cd /var/www/greeting-message/frontend

# Install dependencies
npm install

# Create .env
cat > .env << 'ENV_FILE'
VITE_API_URL=http://180.93.35.4:5000
ENV_FILE

# Build for production
npm run build

# Verify build
if [ -f "build/index.html" ]; then
    echo "✅ Section 5 Complete - Frontend built successfully!"
    ls -lh build/
else
    echo "❌ Build failed!"
fi
```

**Đợi build hoàn tất - có thể mất 1-2 phút**

---

## 🌐 SECTION 6: Configure Nginx

Copy và paste:

```bash
# Create Nginx config
cat > /etc/nginx/sites-available/greeting-message << 'NGINX_CONFIG'
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

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
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

    # Uploads
    location /uploads {
        alias /var/www/greeting-message/backend/uploads;
        expires 1h;
    }

    client_max_body_size 10M;
}
NGINX_CONFIG

# Remove default config
rm -f /etc/nginx/sites-enabled/default

# Enable site
ln -sf /etc/nginx/sites-available/greeting-message /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Section 6 Complete - Nginx configured!"
systemctl status nginx --no-pager | head -10
```

**Phải thấy "nginx -t" báo "syntax is ok"**

---

## 🔥 SECTION 7: Configure Firewall

Copy và paste:

```bash
# Allow ports
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
echo "y" | ufw enable

# Check status
ufw status

echo "✅ Section 7 Complete - Firewall configured!"
```

---

## ✅ SECTION 8: Verify Everything

Copy và paste để kiểm tra:

```bash
echo "=========================================="
echo "🔍 DEPLOYMENT VERIFICATION"
echo "=========================================="
echo ""

echo "=== 1. PM2 Status ==="
pm2 status
echo ""

echo "=== 2. Nginx Status ==="
systemctl status nginx --no-pager | head -5
echo ""

echo "=== 3. Firewall Status ==="
ufw status
echo ""

echo "=== 4. Test API ==="
curl -s http://localhost:5000/api/health
echo ""

echo "=== 5. Listening Ports ==="
netstat -tulpn | grep -E ':(80|5000|3306)' | head -10
echo ""

echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://180.93.35.4"
echo "   API Health: http://180.93.35.4/api/health"
echo ""
echo "👤 Admin Login:"
echo "   URL: http://180.93.35.4"
echo "   Click 'Admin Login' button"
echo "   Username: admin"
echo "   Password: Admin@2024"
echo ""
echo "📊 Useful Commands:"
echo "   pm2 logs greeting-backend    - View backend logs"
echo "   pm2 restart greeting-backend - Restart backend"
echo "   systemctl restart nginx      - Restart Nginx"
echo "   tail -f /var/log/nginx/error.log - Nginx errors"
echo ""
```

---

## 🎯 Sau Khi Deploy Xong

### Test Application

1. Mở browser: **http://180.93.35.4**
2. Bạn sẽ thấy trang chủ của app
3. Click "Admin Login" để vào admin panel
4. Login với:
   - Username: `admin`
   - Password: `Admin@2024`

### Monitoring Commands

```bash
# View backend logs
pm2 logs greeting-backend

# View Nginx logs
tail -f /var/log/nginx/error.log

# Check system resources
htop

# Check disk space
df -h
```

### Update Code (Sau này)

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

## 🐛 Troubleshooting

### Backend không chạy
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

## 🔐 Security Checklist (Làm sau)

- [ ] Đổi admin password trong app
- [ ] Đổi MySQL password
- [ ] Setup SSH key authentication
- [ ] Disable password SSH login
- [ ] Setup automatic backups
- [ ] Setup domain name (optional)
- [ ] Setup SSL certificate (optional)

---

**Chúc bạn deploy thành công! 🚀**

Nếu gặp lỗi ở bước nào, dừng lại và báo cho tôi biết!
