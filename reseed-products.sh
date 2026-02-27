#!/bin/bash

# Script xóa products cũ và seed lại với 18 luxury products

echo "🗑️  Xóa tất cả products cũ..."
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.deleteMany().then(() => console.log('✅ Đã xóa tất cả products')).catch(err => console.error('❌ Lỗi:', err)).finally(() => prisma.\$disconnect());"

echo ""
echo "🌱 Seed 18 luxury products với ảnh thật từ các trang thương mại điện tử VN..."
node seed-products.js

echo ""
echo "📊 Kiểm tra số lượng products..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.product.count().then(count => console.log('Tổng số products:', count)).finally(() => prisma.\$disconnect());"

echo ""
echo "✅ Hoàn thành! Kiểm tra lại trang admin: https://ashfordorder.com/admin/products"
