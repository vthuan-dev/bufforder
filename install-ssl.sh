#!/bin/bash

# Script cài SSL cho api.ashfordorder.com

echo "=== Bước 1: Cài Certbot ==="
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

echo ""
echo "=== Bước 2: Tạo Nginx config ==="
sudo tee /etc/nginx/sites-available/backend-api > /dev/null <<'EOF'
server {
    listen 80;
    server_name api.ashfordorder.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo ""
echo "=== Bước 3: Enable site ==="
sudo ln -sf /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/

echo ""
echo "=== Bước 4: Test Nginx config ==="
sudo nginx -t

echo ""
echo "=== Bước 5: Restart Nginx ==="
sudo systemctl restart nginx

echo ""
echo "=== Bước 6: Tạo SSL certificate ==="
echo "Certbot sẽ hỏi một số câu hỏi:"
echo "  - Email: Nhập email của bạn"
echo "  - Terms: Nhấn Y"
echo "  - Share email: Nhấn N"
echo "  - Redirect HTTP to HTTPS: Nhấn 2"
echo ""
sudo certbot --nginx -d api.ashfordorder.com

echo ""
echo "=== Hoàn thành! ==="
echo "Test HTTPS:"
curl -I https://api.ashfordorder.com/api/health
