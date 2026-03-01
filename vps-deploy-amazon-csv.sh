#!/bin/bash
# Deploy Amazon CSV seed to VPS
# Run locally: bash vps-deploy-amazon-csv.sh

VPS_IP="180.93.35.4"
VPS_USER="root"
VPS_PATH="/var/www/greeting-message/backend"

echo "📦 Deploying Amazon CSV seed to VPS..."
echo ""

# Upload CSV file
echo "📤 Uploading CSV file..."
scp backend/prisma/archive/amazon_products_cleaned.csv ${VPS_USER}@${VPS_IP}:${VPS_PATH}/prisma/archive/

# Upload seed script
echo "📤 Uploading seed script..."
scp backend/seed-from-amazon-csv.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

echo ""
echo "✅ Files uploaded!"
echo ""
echo "🚀 Now run on VPS:"
echo "   ssh ${VPS_USER}@${VPS_IP}"
echo "   cd ${VPS_PATH}"
echo "   node seed-from-amazon-csv.js"
