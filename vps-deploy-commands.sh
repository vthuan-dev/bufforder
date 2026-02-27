#!/bin/bash

# VPS Deployment Commands
# Copy và paste từng section vào terminal VPS

echo "🚀 Greeting Message Platform - VPS Deployment"
echo "=============================================="
echo ""

# SECTION 1: Update System & Install Environment
echo "📦 SECTION 1: Installing Environment..."
echo "Copy và paste các lệnh sau vào VPS terminal:"
echo ""
cat << 'SECTION1'
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js
node --version
npm --version

# Install MySQL
apt install -y mysql-server

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2

# Install Git and utilities
apt install -y git curl wget nano htop unzip

echo "✅ Environment installed!"
SECTION1

echo ""
echo "=============================================="
echo ""

# SECTION 2: Setup MySQL Database
echo "📊 SECTION 2: Setting up MySQL Database..."
echo "Copy và paste các lệnh sau:"
echo ""
cat << 'SECTION2'
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

echo "✅ Database created!"
SECTION2

echo ""
echo "=============================================="
echo ""

# SECTION 3: Clone Repository
echo "📥 SECTION 3: Cloning Repository..."
echo "⚠️  BẠN CẦN THAY <YOUR_GITHUB_REPO_URL> BẰNG URL REPO CỦA BẠN"
echo ""
cat << 'SECTION3'
# Create directory
mkdir -p /var/www/greeting-message
cd /var/www/greeting-message

# Clone repository (THAY URL NÀY!)
git clone <YOUR_GITHUB_REPO_URL> .

# Example:
# git clone https://github.com/yourusername/greeting-message.git .

# Verify
ls -la

echo "✅ Repository cloned!"
SECTION3

echo ""
echo "=============================================="
echo ""

# SECTION 4: Deploy Backend
echo "🔧 SECTION 4: Deploying Backend..."
echo ""
cat << 'SECTION4'
cd /var/www/greeting-message/backend

# Install dependencies
npm install --production

# Create .env file
cat > .env << 'ENV_FILE'
DATABASE_URL="mysql://greeting_user:Greeting@2024!Strong@localhost:3306/greeting_message"
JWT_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
PORT=5000
FRONTEND_URL="http://180.93.35.4"
ALLOWED_ORIGINS=""
ENV_FILE

# Generate random JWT secret
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/\$(openssl rand -base64 32 | tr -d '\\\\n')/$JWT_SECRET/" .env

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create admin account
node create-admin.js admin Admin@2024 admin@example.com "Admin User" || echo "Admin might exist"

# Start with PM2
pm2 delete greeting-backend 2>/dev/null || true
pm2 start server.js --name greeting-backend
pm2 save
pm2 startup

echo "✅ Backend deployed!"
pm2 status
SECTION4

echo ""
echo "=============================================="
echo ""

# SECTION 5: Deploy Frontend
echo "🎨 SECTION 5: Deploying Frontend..."
echo ""
cat << 'SECTION5'
cd /var/www/greeting-message/frontend

# Install dependencies
npm install

# Create .env
cat > .env << 'ENV_FILE'
VITE_API_URL=http://180.93.35.4:5000
ENV_FILE

# Build
npm run build

# Verify
ls -la build/

echo "✅ Frontend built!"
SECTION5

echo ""
echo "=============================================="
echo ""

# SECTION 6: Configure Nginx
echo "🌐 SECTION 6: Configuring Nginx..."
echo ""
cat << 'SECTION6'
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

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
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

# Remove default
rm -f /etc/nginx/sites-enabled/default

# Enable site
ln -sf /etc/nginx/sites-available/greeting-message /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configured!"
SECTION6

echo ""
echo "=============================================="
echo ""

# SECTION 7: Configure Firewall
echo "🔥 SECTION 7: Configuring Firewall..."
echo ""
cat << 'SECTION7'
# Configure UFW
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
echo "y" | ufw enable

# Check status
ufw status

echo "✅ Firewall configured!"
SECTION7

echo ""
echo "=============================================="
echo ""

# SECTION 8: Verify Deployment
echo "✅ SECTION 8: Verifying Deployment..."
echo ""
cat << 'SECTION8'
# Check services
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager

echo ""
echo "=== Firewall Status ==="
ufw status

echo ""
echo "=== Test API ==="
curl -s http://localhost:5000/api/health | head -20

echo ""
echo "=== Listening Ports ==="
netstat -tulpn | grep -E ':(80|5000|3306)'

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Access your application:"
echo "  Frontend: http://180.93.35.4"
echo "  API: http://180.93.35.4/api/health"
echo ""
echo "Admin Login:"
echo "  Username: admin"
echo "  Password: Admin@2024"
SECTION8

echo ""
echo "=============================================="
echo "🎉 All commands ready!"
echo "Copy và paste từng SECTION vào VPS terminal"
