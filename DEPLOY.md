# Deployment Guide

## Build Production Version

### 1. Build Frontend

```bash
cd client
npm run build
```

Output: `client/dist/` — chứa static files đã optimize.

### 2. Cấu hình Production Server

File `server/.env`:

```env
PORT=3001
JWT_SECRET=CHANGE_THIS_TO_A_SECURE_SECRET_KEY
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### 3. Deploy Options

#### Option A: Local Network (Không cần internet)

```bash
# Start server
cd server
npm start

# Start frontend (sẽ proxy qua server)
cd client
npm run dev
```

Người khác trong mạng LAN truy cập: `http://YOUR_IP:5173`

#### Option B: Deploy lên Cloud (Miễn phí)

##### Railway.app (Khuyến nghị - dễ nhất)

1. Push code lên GitHub
2. Connect Railway với repo
3. Tạo 2 projects: `server` và `client`
4. Set environment variables
5. Deploy tự động

##### Render.com

1. Tạo Web Service cho `server`:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

2. Tạo Static Site cho `client`:
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

3. Cập nhật `vite.config.ts` proxy URL:

```ts
proxy: {
  '/api': {
    target: 'https://your-server.railway.app',
    changeOrigin: true,
  },
  '/socket.io': {
    target: 'https://your-server.railway.app',
    ws: true,
  },
  '/uploads': {
    target: 'https://your-server.railway.app',
    changeOrigin: true,
  },
}
```

##### VPS (DigitalOcean, AWS, etc.)

```bash
# SSH vào server
ssh root@your-server-ip

# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Clone hoặc upload code
git clone https://github.com/your-username/teamchat.git
cd teamchat

# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build frontend
cd client && npm run build && cd ..

# Cấu hình PM2 (process manager)
npm install -g pm2
pm2 start server/src/index.js --name teamchat-server

# Cấu hình Nginx
apt install nginx
```

Nginx config (`/etc/nginx/sites-available/teamchat`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/teamchat/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /path/to/teamchat/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/teamchat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL với Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 4. Database

Mặc định dùng SQLite (file-based). Để production:

#### SQLite (đơn giản, cho ít user)
- Database file: `database/chat.db`
- Backup định kỳ:
```bash
cp database/chat.db database/chat.db.backup
```

#### PostgreSQL (khuyến nghị cho production)

Cài đặt:
```bash
# Ubuntu
apt install postgresql postgresql-contrib

# Tạo database
sudo -u postgres psql
CREATE DATABASE teamchat;
CREATE USER teamchat_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE teamchat TO teamchat_user;
\q
```

Cập nhật `server/src/database/db.js`:
```javascript
// Thay thế sql.js bằng pg (PostgreSQL driver)
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: 'teamchat',
  user: 'teamchat_user',
  password: process.env.DB_PASSWORD,
  port: 5432,
});
```

### 5. Environment Variables Production

```env
# Server
PORT=3001
NODE_ENV=production
JWT_SECRET=your_very_long_random_secret_here_minimum_32_chars
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:pass@host:5432/teamchat

# Client (trong .env.production)
VITE_API_URL=https://your-server.com
VITE_WS_URL=wss://your-server.com
```

### 6. Security Checklist

- [ ] Đổi JWT_SECRET thành key ngẫu nhiên dài
- [ ] Bật HTTPS (SSL certificate)
- [ ] Cấu hình CORS chỉ cho domain của bạn
- [ ] Đặt file upload giới hạn kích thước
- [ ] Backup database định kỳ
- [ ] Cập nhật rate limiting
- [ ] Bật logging và monitoring

### 7. Quick Start Script

Tạo file `deploy.sh`:

```bash
#!/bin/bash

echo "Building TeamChat..."

# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build frontend
cd client
npm run build
cd ..

echo "Build complete! Files in client/dist/"
echo "Start server: cd server && npm start"
```
