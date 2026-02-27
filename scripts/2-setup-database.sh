#!/bin/bash

# Script 2: Setup MySQL Database
# Run this on VPS after installing environment

set -e

echo "🗄️ Setting up MySQL database..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Start MySQL
echo -e "${GREEN}Starting MySQL service...${NC}"
systemctl start mysql
systemctl enable mysql

echo -e "${YELLOW}Creating database and user...${NC}"

# Create database and user
mysql -u root <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS greeting_message CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'greeting_user'@'localhost' IDENTIFIED BY 'Greeting@2024!Strong';
GRANT ALL PRIVILEGES ON greeting_message.* TO 'greeting_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Database: greeting_message"
echo "User: greeting_user"
echo "Password: Greeting@2024!Strong"
echo ""
echo -e "${YELLOW}Next step: Clone your repository${NC}"
