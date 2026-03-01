#!/bin/bash
# Seed 100 luxury products from Amazon SQL (BEST QUALITY)
# All images from Amazon CDN - 100% working
# Run on VPS: bash vps-seed-amazon-100.sh

echo "🌱 Seeding 100 luxury products with Amazon images..."
echo "📸 All images from Amazon CDN - 100% real product photos"
echo ""

cd /var/www/greeting-message/backend

# Run SQL file with password embedded
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < prisma/products_seed.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully seeded 100 products!"
  echo "💰 Price range: $65 - $5,000"
  echo "🏆 Includes luxury items: $1k-$5k"
  echo "📸 All images from Amazon CDN"
  echo ""
  echo "📊 Check products:"
  mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "SELECT COUNT(*) as total FROM product;"
  echo ""
  echo "🌐 View at: https://ashfordorder.com/admin/products"
else
  echo ""
  echo "❌ Error seeding products"
fi
