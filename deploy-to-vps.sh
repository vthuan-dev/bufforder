#!/bin/bash

# VPS Deployment Script for Greeting Message Platform
# VPS: 180.93.35.4

echo "🚀 Starting deployment to VPS..."

VPS_IP="180.93.35.4"
VPS_USER="root"
VPS_PASSWORD="AZvps1l7m@du7@3"
APP_DIR="/var/www/greeting-message"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Step 1: Connecting to VPS...${NC}"

# Create deployment commands
cat > /tmp/deploy_commands.sh << 'DEPLOY_SCRIPT'
#!/bin/bash

echo "=== VPS Deployment Started ==="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js
echo "✅ Node.js version:"
node --version
npm --version

# Install MySQL
echo "📦 Installing MySQL..."
apt install -y mysql-server

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Git
echo "📦 Installing Git..."
apt install -y git

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /var/www/greeting-message
cd /var/www/greeting-message

# Clone repository (you need to provide the repo URL)
echo "⚠️  Please clone your repository manually:"
echo "cd /var/www/greeting-message"
echo "git clone <your-github-repo-url> ."

echo ""
echo "=== Initial Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Clone your GitHub repository"
echo "2. Setup MySQL database"
echo "3. Configure backend .env"
echo "4. Run migrations"
echo "5. Build frontend"
echo "6. Configure Nginx"
echo "7. Setup SSL"

DEPLOY_SCRIPT

chmod +x /tmp/deploy_commands.sh

echo -e "${YELLOW}Deployment script created at: /tmp/deploy_commands.sh${NC}"
echo ""
echo -e "${GREEN}To deploy, run these commands:${NC}"
echo ""
echo "# 1. Copy script to VPS"
echo "scp /tmp/deploy_commands.sh root@180.93.35.4:/root/"
echo ""
echo "# 2. SSH to VPS"
echo "ssh root@180.93.35.4"
echo ""
echo "# 3. Run deployment script"
echo "bash /root/deploy_commands.sh"
echo ""
echo -e "${YELLOW}Or use this one-liner:${NC}"
echo "ssh root@180.93.35.4 'bash -s' < /tmp/deploy_commands.sh"
