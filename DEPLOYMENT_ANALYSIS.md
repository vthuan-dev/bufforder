# 📊 Phân Tích Dự Án & Hướng Dẫn Deploy VPS

## 🎯 Tổng Quan Dự Án

**Greeting Message Platform** là một nền tảng thương mại điện tử với hệ thống VIP và hoa hồng, cho phép users nhận orders và kiếm commission.

---

## 🏗️ Kiến Trúc Hệ Thống

### 1. Backend (Node.js + Express)

**Công nghệ:**
- Runtime: Node.js
- Framework: Express.js
- Database ORM: Prisma 5.22.0
- Real-time: Socket.IO 4.8.1
- Authentication: JWT (jsonwebtoken)
- Password: bcryptjs

**Cấu trúc thư mục:**
```
backend/
├── config/              # VIP levels configuration
├── lib/                 # Prisma client, cache, utils
├── middleware/          # Auth middleware
├── migrations/          # SQL migration files
├── prisma/             # Prisma schema
├── routes/             # API routes (7 routes)
│   ├── admin.js        # Admin management
│   ├── auth.js         # User authentication
│   ├── chat.js         # Chat support
│   ├── orders.js       # Order management
│   ├── products.js     # Product catalog
│   ├── usdt-wallets.js # USDT wallet management
│   └── vip.js          # VIP & wallet operations
├── services/           # Business logic services
├── uploads/            # File uploads (images)
├── server.js           # Main server file
├── config.js           # App configuration
└── package.json
```

**API Endpoints:**
- `/api/auth/*` - Authentication (login, register)
- `/api/vip/*` - VIP & wallet operations
- `/api/orders/*` - Order management
- `/api/admin/*` - Admin panel APIs
- `/api/chat/*` - Chat support
- `/api/products/*` - Product catalog
- `/api/usdt-wallets/*` - USDT wallet management

**Port:** 5000 (configurable)

---

### 2. Frontend (React + TypeScript)

**Công nghệ:**
- Framework: React 18 + TypeScript
- Build Tool: Vite 6.3.5
- Styling: Tailwind CSS
- UI Components: Radix UI
- State Management: React Hooks
- Real-time: Socket.IO Client
- Internationalization: i18next (English + Vietnamese)

**Cấu trúc thư mục:**
```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── admin/        # Admin panel (8+ pages)
│   │   ├── ui/           # Radix UI components
│   │   └── *.tsx         # User pages (20+ pages)
│   ├── i18n/             # Internationalization
│   │   └── locales/      # en/ và vi/ translations
│   ├── services/         # API service layer (api.ts)
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── hooks/            # Custom React hooks
│   ├── config/           # Configuration files
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── vite.config.ts
└── package.json
```

**Build Output:** `frontend/build/` (static files)

**Port:** 3000 (development), static files cho production

---

### 3. Database (MySQL)

**Công nghệ:**
- Database: MySQL 8.0+ / MariaDB 10.4+
- ORM: Prisma
- Charset: utf8mb4 (hỗ trợ emoji)
- Engine: InnoDB (hỗ trợ transactions)

**Schema Overview:**
```
9 Tables:
├── User                 # Users (balance, VIP, commission)
├── Admin                # Admin accounts
├── Order                # Orders (products, commission)
├── DepositRequest       # Deposit requests
├── WithdrawalRequest    # Withdrawal requests
├── Address              # Shipping addresses
├── BankCard             # Bank cards
├── UsdtWallet           # USDT wallets (TRC20/ERC20)
├── ChatThread           # Chat threads
├── ChatMessage          # Chat messages
├── Product              # Product catalog
└── Notification         # User notifications
```

**Quan hệ chính:**
- User → Orders (1:N)
- User → DepositRequests (1:N)
- User → WithdrawalRequests (1:N)
- User → Addresses (1:N, max 3)
- User → BankCards (1:N, max 3)
- User → UsdtWallets (1:N)
- User → ChatThreads (1:N)
- ChatThread → ChatMessages (1:N)

**Database Name:** `greeting_message`

---

## 📦 Dependencies Analysis

### Backend Dependencies (Production)
```json
{
  "@prisma/client": "^5.22.0",      // Database ORM
  "bcryptjs": "^2.4.3",             // Password hashing
  "compression": "^1.8.1",          // Response compression
  "cors": "^2.8.5",                 // CORS handling
  "dotenv": "^16.3.1",              // Environment variables
  "express": "^4.18.2",             // Web framework
  "jsonwebtoken": "^9.0.2",         // JWT authentication
  "multer": "^2.0.2",               // File upload
  "prisma": "^5.22.0",              // Prisma CLI
  "socket.io": "^4.8.1"             // Real-time communication
}
```

### Frontend Dependencies (Production)
```json
{
  "react": "^18.3.1",               // React core
  "react-dom": "^18.3.1",           // React DOM
  "@radix-ui/*": "^1.x",            // UI components (15+ packages)
  "socket.io-client": "^4.8.1",     // Real-time client
  "i18next": "^25.7.4",             // Internationalization
  "react-i18next": "^16.5.3",       // React i18n bindings
  "lucide-react": "^0.487.0",       // Icons
  "tailwind-merge": "*",            // Tailwind utilities
  "motion": "^12.23.24",            // Animations
  "recharts": "^2.15.2",            // Charts
  "sonner": "^2.0.3"                // Toast notifications
}
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="mysql://user:password@host:3306/greeting_message"

# JWT Secret (PHẢI ĐỔI trong production!)
JWT_SECRET="your_jwt_secret_key_here_change_this_in_production"

# Server Port
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL="https://yourdomain.com"

# Additional CORS origins (comma-separated)
ALLOWED_ORIGINS="https://www.yourdomain.com,https://admin.yourdomain.com"
```

### Frontend (build time)
Frontend không cần .env file riêng, nhưng cần cấu hình API URL trong `src/services/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Có thể tạo `.env` trong frontend:
```env
VITE_API_URL=https://api.yourdomain.com
```

---

## 🚀 Deployment Strategy

### Option 1: Single VPS (Recommended cho bắt đầu)

**Cấu hình VPS tối thiểu:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 40GB SSD
- OS: Ubuntu 20.04/22.04 LTS

**Kiến trúc:**
```
Internet
    ↓
Nginx (Port 80/443)
    ↓
    ├─→ Frontend (Static files)
    └─→ Backend (Port 5000)
            ↓
        MySQL (Port 3306)
```

---

### Option 2: Separated Services (Recommended cho production)

**Kiến trúc:**
```
Internet
    ↓
Load Balancer / CDN
    ↓
    ├─→ Frontend Server (Nginx)
    ├─→ Backend Server (Node.js)
    └─→ Database Server (MySQL)
```

---

## 📋 Deployment Checklist

### 1. Chuẩn Bị VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # v18.x.x
npm --version   # 9.x.x

# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

---

### 2. Setup MySQL Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database
CREATE DATABASE greeting_message CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user
CREATE USER 'greeting_user'@'localhost' IDENTIFIED BY 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON greeting_message.* TO 'greeting_user'@'localhost';
FLUSH PRIVILEGES;

# Exit
EXIT;
```

---

### 3. Deploy Backend

```bash
# Create app directory
sudo mkdir -p /var/www/greeting-message
cd /var/www/greeting-message

# Clone repository
sudo git clone <your-repo-url> .

# Set permissions
sudo chown -R $USER:$USER /var/www/greeting-message

# Install backend dependencies
cd backend
npm install --production

# Create .env file
nano .env
```

**Backend .env:**
```env
DATABASE_URL="mysql://greeting_user:strong_password_here@localhost:3306/greeting_message"
JWT_SECRET="generate_random_secret_here_min_32_chars"
PORT=5000
FRONTEND_URL="https://yourdomain.com"
ALLOWED_ORIGINS="https://www.yourdomain.com"
```

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create admin account
node create-admin.js admin your_admin_password admin@yourdomain.com "Admin Name"

# Test backend
node server.js
# Ctrl+C to stop

# Start with PM2
pm2 start server.js --name greeting-backend
pm2 save
pm2 startup
```

---

### 4. Deploy Frontend

```bash
# Go to frontend directory
cd /var/www/greeting-message/frontend

# Create .env for build
nano .env
```

**Frontend .env:**
```env
VITE_API_URL=https://api.yourdomain.com
```

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build output will be in: frontend/build/
```

---

### 5. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/greeting-message
```

**Nginx Configuration:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

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
        
        # Socket.IO support
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
    }

    # Increase upload size for images
    client_max_body_size 10M;
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

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
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/greeting-message /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### 6. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

**Update Nginx config** để uncomment các dòng HTTPS redirect.

---

### 7. Setup Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

### 8. Configure PM2 Auto-restart

```bash
# PM2 ecosystem file
cd /var/www/greeting-message/backend
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'greeting-backend',
    script: './server.js',
    instances: 2,  // Cluster mode
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

```bash
# Create logs directory
mkdir -p logs

# Start with ecosystem
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Frontend API URL

Nếu chưa set trong build, cần update `frontend/src/services/api.ts`:

```typescript
const API_URL = 'https://api.yourdomain.com';
```

Sau đó rebuild:
```bash
cd /var/www/greeting-message/frontend
npm run build
```

---

### 2. Configure CORS

Update `backend/server.js` để thêm domain của bạn:

```javascript
const STATIC_ALLOWED = new Set([
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://api.yourdomain.com'
]);
```

Restart backend:
```bash
pm2 restart greeting-backend
```

---

### 3. Setup Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-greeting-db.sh
```

**backup-greeting-db.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="greeting_message"
DB_USER="greeting_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${DB_NAME}_${DATE}.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-greeting-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
```

Add line:
```
0 2 * * * /usr/local/bin/backup-greeting-db.sh >> /var/log/mysql-backup.log 2>&1
```

---

### 4. Setup Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor
pm2 monit
```

---

## 📊 Performance Optimization

### 1. MySQL Optimization

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add/update:
```ini
[mysqld]
# InnoDB settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Query cache (if MySQL < 8.0)
query_cache_type = 1
query_cache_size = 64M

# Connection settings
max_connections = 200
```

```bash
sudo systemctl restart mysql
```

---

### 2. Node.js Optimization

Backend đã có:
- ✅ Compression middleware
- ✅ Response caching headers
- ✅ Connection pooling (Prisma)
- ✅ Efficient queries với indexes

---

### 3. Nginx Optimization

Đã có trong config:
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ Client max body size

---

## 🔍 Monitoring & Maintenance

### Check Backend Status
```bash
pm2 status
pm2 logs greeting-backend
pm2 monit
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check MySQL Status
```bash
sudo systemctl status mysql
sudo mysql -u root -p -e "SHOW PROCESSLIST;"
sudo mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

### Check Disk Space
```bash
df -h
du -sh /var/www/greeting-message/*
```

### Check Memory Usage
```bash
free -h
top
htop
```

---

## 🐛 Troubleshooting

### Backend không start
```bash
# Check logs
pm2 logs greeting-backend --lines 100

# Check port
sudo netstat -tulpn | grep :5000

# Restart
pm2 restart greeting-backend
```

### Database connection error
```bash
# Test connection
mysql -u greeting_user -p greeting_message

# Check Prisma
cd /var/www/greeting-message/backend
npx prisma db pull
```

### Frontend không load
```bash
# Check Nginx
sudo nginx -t
sudo systemctl restart nginx

# Check build files
ls -la /var/www/greeting-message/frontend/build/
```

### Socket.IO không hoạt động
- Kiểm tra Nginx config có proxy WebSocket headers
- Kiểm tra CORS settings
- Kiểm tra firewall không block WebSocket

---

## 📈 Scaling Considerations

### Khi nào cần scale?

1. **CPU > 80%** → Tăng instances PM2 hoặc upgrade VPS
2. **RAM > 80%** → Optimize queries hoặc upgrade RAM
3. **Database slow** → Add indexes, optimize queries, hoặc separate DB server
4. **High traffic** → Add load balancer, CDN, hoặc multiple servers

### Scaling Options

1. **Vertical Scaling** (Đơn giản nhất)
   - Upgrade VPS specs (CPU, RAM, Storage)

2. **Horizontal Scaling** (Phức tạp hơn)
   - Multiple backend instances với load balancer
   - Separate database server
   - Redis cache layer
   - CDN cho static assets

---

## ✅ Final Checklist

- [ ] VPS setup hoàn tất
- [ ] MySQL installed và configured
- [ ] Database created và migrated
- [ ] Admin account created
- [ ] Backend deployed với PM2
- [ ] Frontend built và deployed
- [ ] Nginx configured
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Database backups scheduled
- [ ] Monitoring setup
- [ ] Domain DNS configured
- [ ] Test all features:
  - [ ] User registration/login
  - [ ] Admin login
  - [ ] Order creation
  - [ ] Chat functionality
  - [ ] Deposit/Withdrawal requests
  - [ ] Real-time notifications

---

## 🎉 Deployment Complete!

Dự án của bạn đã sẵn sàng trên VPS!

**URLs:**
- Frontend: https://yourdomain.com
- Admin Panel: https://yourdomain.com (click Admin Login)
- API: https://api.yourdomain.com
- Health Check: https://api.yourdomain.com/api/health

**Next Steps:**
1. Test tất cả features
2. Monitor logs trong 24h đầu
3. Setup analytics (Google Analytics, etc.)
4. Configure email notifications (optional)
5. Setup CDN cho images (optional)

---

**Good luck với deployment! 🚀**
