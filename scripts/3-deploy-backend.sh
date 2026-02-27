#!/bin/bash

# Script 3: Deploy Backend
# Run this in /var/www/greeting-message/backend

set -e

echo "🔧 Deploying backend..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the backend directory?${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Installing dependencies...${NC}"
npm install --production

echo -e "${GREEN}Step 2: Checking .env file...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env <<ENV_FILE
DATABASE_URL="mysql://greeting_user:Greeting@2024!Strong@localhost:3306/greeting_message"
JWT_SECRET="$(openssl rand -base64 32)"
PORT=5000
FRONTEND_URL="http://180.93.35.4"
ALLOWED_ORIGINS=""
ENV_FILE
    echo -e "${GREEN}.env file created!${NC}"
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

echo -e "${GREEN}Step 3: Generating Prisma Client...${NC}"
npx prisma generate

echo -e "${GREEN}Step 4: Running database migrations...${NC}"
npx prisma migrate deploy

echo -e "${GREEN}Step 5: Creating admin account...${NC}"
if [ -f "create-admin.js" ]; then
    node create-admin.js admin Admin@2024 admin@example.com "Admin User" || echo "Admin might already exist"
fi

echo -e "${GREEN}Step 6: Starting backend with PM2...${NC}"
pm2 delete greeting-backend 2>/dev/null || true
pm2 start server.js --name greeting-backend
pm2 save

echo -e "${GREEN}✅ Backend deployment complete!${NC}"
echo ""
echo "Backend is running on port 5000"
echo "Check status: pm2 status"
echo "View logs: pm2 logs greeting-backend"
