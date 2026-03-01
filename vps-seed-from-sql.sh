#!/bin/bash
# Seed 100 luxury products from SQL file (Amazon images)
# Run on VPS: bash vps-seed-from-sql.sh

echo "🌱 Seeding 100 luxury products from SQL file..."
echo ""

cd /var/www/greeting-message/backend

# Run SQL file with password embedded
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < prisma/products_seed.sql

echo ""
echo "✅ Done! 100 products with real Amazon images seeded"
echo "📊 Check: mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e 'SELECT COUNT(*) FROM product;'"
