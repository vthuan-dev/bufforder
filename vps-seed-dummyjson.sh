#!/bin/bash
# Seed ~194 products from DummyJSON API (REAL product images)
# Run on VPS: bash vps-seed-dummyjson.sh

echo "🌱 Seeding products from DummyJSON API..."
echo "📸 All products have REAL product images from CDN"
echo ""

cd /var/www/greeting-message/backend

# Run the seed script
node seed-from-dummyjson.js

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
