#!/bin/bash

# VPS Reseed Products Script
# Run this on your VPS to delete all products and reseed with 18 luxury products

echo "🚀 Starting product reseed on VPS..."
echo ""

# Navigate to backend directory
cd /var/www/greeting-message/backend

echo "🗑️  Deleting all existing products..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.deleteMany().then(() => console.log('✅ All products deleted')).catch(err => console.error('❌ Error:', err)).finally(() => prisma.\$disconnect());"

echo ""
echo "🌱 Seeding 18 luxury products with real images..."
node seed-products.js

echo ""
echo "📊 Checking product count..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.count().then(count => console.log('Total products:', count)).finally(() => prisma.\$disconnect());"

echo ""
echo "✅ Reseed complete!"
echo "🌐 Check admin panel: https://ashfordorder.com/admin/products"
