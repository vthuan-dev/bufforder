#!/bin/bash

# Script 4: Deploy Frontend
# Run this in /var/www/greeting-message/frontend

set -e

echo "🎨 Deploying frontend..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the frontend directory?${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Installing dependencies...${NC}"
npm install

echo -e "${GREEN}Step 2: Creating .env file...${NC}"
cat > .env <<ENV_FILE
VITE_API_URL=http://180.93.35.4:5000
ENV_FILE

echo -e "${GREEN}Step 3: Building for production...${NC}"
npm run build

echo -e "${GREEN}Step 4: Verifying build...${NC}"
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    ls -lh build/
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend deployment complete!${NC}"
echo ""
echo "Build output: $(pwd)/build"
echo ""
echo -e "${YELLOW}Next step: Configure Nginx${NC}"
