#!/bin/bash

# Script 1: Install Environment on VPS
# Run this on VPS after SSH login

set -e

echo "🚀 Installing environment on VPS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo -e "${GREEN}Step 3: Verifying Node.js installation...${NC}"
node --version
npm --version

echo -e "${GREEN}Step 4: Installing MySQL...${NC}"
apt install -y mysql-server

echo -e "${GREEN}Step 5: Installing Nginx...${NC}"
apt install -y nginx

echo -e "${GREEN}Step 6: Installing PM2...${NC}"
npm install -g pm2

echo -e "${GREEN}Step 7: Installing Git and utilities...${NC}"
apt install -y git curl wget nano htop

echo -e "${GREEN}✅ Environment installation complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: bash 2-setup-database.sh"
echo "2. Clone your repository"
echo "3. Configure and deploy"
