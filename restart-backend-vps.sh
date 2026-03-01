#!/bin/bash
# Restart backend on VPS to apply image proxy fix

echo "🔄 Restarting backend on VPS..."

ssh root@180.93.35.4 << 'EOF'
cd /var/www/greeting-message/backend

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔄 Restarting PM2..."
pm2 restart backend

echo "✅ Backend restarted successfully!"
pm2 status
EOF

echo ""
echo "✅ Done! Backend is now running with image proxy."
echo "🌐 Images from Amazon CDN will now be proxied through: https://api.ashfordorder.com/api/image-proxy"
echo ""
echo "⏳ Wait 2-3 minutes for Vercel to deploy frontend, then test:"
echo "   1. Open https://ashfordorder.com"
echo "   2. Go to Orders page"
echo "   3. Check if product images display correctly"
echo "   4. Hard refresh (Ctrl+Shift+R) if needed"
