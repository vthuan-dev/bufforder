# Fix Mixed Content Error - HTTPS cho Backend

## Vấn đề
```
Mixed Content: The page at 'https://bufforder.vercel.app/' was loaded over HTTPS, 
but requested an insecure resource 'http://180.93.35.4:5000/api/auth/login'. 
This request has been blocked; the content must be served over HTTPS.
```

**Nguyên nhân**: Frontend (HTTPS) không thể gọi Backend (HTTP)

## Giải pháp 1: Cài SSL cho VPS (Khuyến nghị)

### Bước 1: Cần có domain cho VPS
Bạn cần trỏ domain/subdomain về VPS. Ví dụ:
- `api.bufforder.com` → `180.93.35.4`
- Hoặc subdomain miễn phí từ các dịch vụ như DuckDNS, No-IP

### Bước 2: Cài Certbot (Let's Encrypt SSL miễn phí)

SSH vào VPS và chạy:

```bash
# Cài Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Tạo SSL certificate (thay your-domain.com)
sudo certbot --nginx -d api.bufforder.com

# Certbot sẽ tự động:
# 1. Tạo SSL certificate
# 2. Cấu hình Nginx
# 3. Redirect HTTP → HTTPS
```

### Bước 3: Cấu hình Nginx cho backend

Tạo file config:
```bash
sudo nano /etc/nginx/sites-available/backend
```

Nội dung:
```nginx
server {
    listen 80;
    server_name api.bufforder.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bufforder.com;

    ssl_certificate /etc/letsencrypt/live/api.bufforder.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bufforder.com/privkey.pem;

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
```

Enable và restart:
```bash
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Bước 4: Update Vercel Environment Variable

Thay đổi từ:
```
VITE_API_BASE_URL=http://180.93.35.4:5000
```

Thành:
```
VITE_API_BASE_URL=https://api.bufforder.com
```

Sau đó redeploy Vercel.

---

## Giải pháp 2: Dùng Cloudflare Tunnel (Không cần domain)

### Ưu điểm:
- Miễn phí SSL
- Không cần mở port
- Tự động có HTTPS

### Cài đặt:

```bash
# SSH vào VPS
ssh root@180.93.35.4

# Cài cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login Cloudflare
cloudflared tunnel login

# Tạo tunnel
cloudflared tunnel create bufforder-backend

# Cấu hình tunnel
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Nội dung `config.yml`:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api-bufforder.your-cf-domain.com
    service: http://localhost:5000
  - service: http_status:404
```

Chạy tunnel:
```bash
cloudflared tunnel run bufforder-backend
```

Bạn sẽ có URL HTTPS miễn phí: `https://api-bufforder.your-cf-domain.com`

---

## Giải pháp 3: Tạm thời - Dùng Ngrok (Test only)

**Chỉ dùng để test, không dùng production!**

```bash
# SSH vào VPS
ssh root@180.93.35.4

# Cài ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update
sudo apt install ngrok

# Chạy ngrok (cần tạo account tại ngrok.com để lấy authtoken)
ngrok config add-authtoken YOUR_TOKEN
ngrok http 5000
```

Ngrok sẽ cho bạn URL HTTPS: `https://abc123.ngrok.io`

Update Vercel env:
```
VITE_API_BASE_URL=https://abc123.ngrok.io
```

**Lưu ý**: URL ngrok thay đổi mỗi lần restart (trừ khi dùng paid plan)

---

## Khuyến nghị

**Giải pháp tốt nhất**: Giải pháp 1 (SSL với domain)
- Professional
- Miễn phí (Let's Encrypt)
- Ổn định

**Nếu chưa có domain**: Giải pháp 2 (Cloudflare Tunnel)
- Miễn phí
- Dễ setup
- Có HTTPS ngay

**Chỉ để test**: Giải pháp 3 (Ngrok)

---

## Bạn có domain chưa?

Nếu chưa có domain, bạn có thể:
1. Mua domain rẻ (~$1-2/năm) từ Namecheap, Porkbun
2. Dùng subdomain miễn phí: DuckDNS, FreeDNS
3. Dùng Cloudflare Tunnel (không cần domain riêng)

Cho tôi biết bạn muốn dùng giải pháp nào, tôi sẽ hướng dẫn chi tiết!
