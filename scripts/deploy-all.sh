#!/bin/bash

# Master Deployment Script
# Run this on VPS to deploy everything

set -e

echo "🚀 Starting full deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}This will:${NC}"
echo "1. Install environment (Node.js, MySQL, Nginx, PM2)"
echo "2. Setup MySQL database"
echo "3. Deploy backend"
echo "4. Deploy frontend"
echo "5. Configure Nginx"
echo "6. Configure firewall"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Check if repository is cloned
if [ ! -d "/var/www/greeting-message" ]; then
    echo -e "${RED}Error: Repository not found at /var/www/greeting-message${NC}"
    echo "Please clone your repository first:"
    echo "  mkdir -p /var/www/greeting-message"
    echo "  cd /var/www/greeting-message"
    echo "  git clone <your-repo-url> ."
    exit 1
fi

# Run all scripts
echo -e "${GREEN}=== Step 1: Installing environment ===${NC}"
bash "$SCRIPT_DIR/1-install-environment.sh"

echo -e "${GREEN}=== Step 2: Setting up database ===${NC}"
bash "$SCRIPT_DIR/2-setup-database.sh"

echo -e "${GREEN}=== Step 3: Deploying backend ===${NC}"
cd /var/www/greeting-message/backend
bash "$SCRIPT_DIR/3-deploy-backend.sh"

echo -e "${GREEN}=== Step 4: Deploying frontend ===${NC}"
cd /var/www/greeting-message/frontend
bash "$SCRIPT_DIR/4-deploy-frontend.sh"

echo -e "${GREEN}=== Step 5: Configuring Nginx ===${NC}"
bash "$SCRIPT_DIR/5-configure-nginx.sh"

echo -e "${GREEN}=== Step 6: Configuring firewall ===${NC}"
bash "$SCRIPT_DIR/6-configure-firewall.sh"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Access your application:"
echo "  Frontend: http://180.93.35.4"
echo "  API Health: http://180.93.35.4/api/health"
echo "  Admin Login: http://180.93.35.4 (click Admin Login)"
echo ""
echo "Admin credentials:"
echo "  Username: admin"
echo "  Password: Admin@2024"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check backend status"
echo "  pm2 logs greeting-backend - View backend logs"
echo "  systemctl status nginx  - Check Nginx status"
echo "  ufw status             - Check firewall status"
