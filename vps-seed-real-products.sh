#!/bin/bash
# Seed 2000 products with REAL product images from APIs
# Run on VPS: bash vps-seed-real-products.sh

echo "🌱 Seeding 2000 products with real product images..."
echo ""

cd /var/www/greeting-message/backend

# Run the seed script
node seed-2000-from-real-apis.js

echo ""
echo "✅ Done! Check admin products page at https://ashfordorder.com/admin/products"
