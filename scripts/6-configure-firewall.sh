#!/bin/bash

# Script 6: Configure Firewall
# Run this on VPS

set -e

echo "🔥 Configuring firewall..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  This will enable UFW firewall${NC}"
echo -e "${YELLOW}Make sure SSH (port 22) is allowed!${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo -e "${GREEN}Configuring firewall rules...${NC}"

# Allow SSH (CRITICAL!)
ufw allow OpenSSH

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Allow backend port
ufw allow 5000/tcp

# Enable firewall
echo "y" | ufw enable

echo -e "${GREEN}✅ Firewall configured!${NC}"
echo ""
ufw status
