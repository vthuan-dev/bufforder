#!/bin/bash
# Seed 1600 products with REAL product images from APIs
# Run on VPS: bash vps-seed-1600-real.sh

echo "🌱 Seeding 1600 products with real product images from APIs..."
echo ""

cd /var/www/greeting-message/backend

# Run the seed script
node seed-1600-real-products.js

echo ""
echo "✅ Done! Check admin products page at https://ashfordorder.com/admin/products"
