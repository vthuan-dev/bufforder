#!/bin/bash

echo "🌱 Seeding Amazon products on VPS..."
echo ""

# Navigate to project directory
cd /var/www/greeting-message

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull

# Run SQL seed
echo ""
echo "💾 Importing products into database..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < backend/prisma/amazon_products_full.sql

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully seeded products!"
    echo ""
    echo "📊 Checking product count..."
    mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "SELECT COUNT(*) as total_products FROM product;"
    echo ""
    echo "💰 Price distribution:"
    mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "
    SELECT 
        CASE 
            WHEN price < 100 THEN '\$10-\$100'
            WHEN price < 500 THEN '\$100-\$500'
            WHEN price < 1000 THEN '\$500-\$1k'
            WHEN price < 3000 THEN '\$1k-\$3k'
            WHEN price < 10000 THEN '\$3k-\$10k'
            ELSE '\$10k-\$30k'
        END as price_range,
        COUNT(*) as count,
        CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM product), 1), '%') as percentage
    FROM product
    GROUP BY price_range
    ORDER BY MIN(price);
    "
    echo ""
    echo "🎉 Seeding complete!"
else
    echo ""
    echo "❌ Error seeding products"
    exit 1
fi
