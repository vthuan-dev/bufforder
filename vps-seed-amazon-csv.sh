#!/bin/bash
# Seed 2000 products from Amazon CSV (BEST OPTION!)
# Run on VPS: bash vps-seed-amazon-csv.sh

echo "🌱 Seeding 2000 products from Amazon CSV..."
echo "📸 All images from Amazon CDN - 100% real product photos"
echo "💰 Price range: $10 - $30,000 (diverse pricing)"
echo ""

cd /var/www/greeting-message/backend

# Create archive directory if not exists
mkdir -p prisma/archive

# Check if CSV exists
if [ ! -f "prisma/archive/amazon_products_cleaned.csv" ]; then
  echo "❌ CSV file not found!"
  echo "📤 Please upload the CSV file first:"
  echo "   scp backend/prisma/archive/amazon_products_cleaned.csv root@180.93.35.4:/var/www/greeting-message/backend/prisma/archive/"
  exit 1
fi

# Run seed script
node seed-from-amazon-csv.js

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully seeded products!"
  echo "📊 Check products count:"
  mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "SELECT COUNT(*) as total FROM product;"
  echo ""
  echo "🌐 View at: https://ashfordorder.com/admin/products"
else
  echo ""
  echo "❌ Error seeding products"
fi
