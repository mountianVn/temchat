# Hướng Dẫn Deploy Lên Railway

## Các Bước Thực Hiện

### Bước 1: Push Code Lên GitHub

1. Tạo repo mới trên GitHub
2. Push code:
```bash
cd C:\Users\PC\OneDrive\Máy tính\app
git init
git add .
git commit -m "TeamChat App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/teamchat.git
git push -u origin main
```

### Bước 2: Tạo Tài Khoản Railway

1. Truy cập https://railway.app
2. Đăng nhập với GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Chọn repo `teamchat`

### Bước 3: Cấu Hình Variables

Trong Railway project settings, thêm biến môi trường:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | `your_random_secret_key_here` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

### Bước 4: Deploy

Railway sẽ tự động detect và deploy.

Sau khi deploy xong, bạn sẽ có URL dạng:
```
https://teamchat-something.up.railway.app
```

### Bước 5: Chia Sẻ URL

Gửi URL cho người khác - họ có thể truy cập từ bất kỳ đâu!

## Cách Nhanh Hơn: Dùng Ngrok (Test)

Nếu muốn test nhanh mà chưa có Railway:

```bash
# Cài ngrok
npm install -g ngrok

# Start server
cd server
npm run dev

# Trong terminal khác, chạy ngrok
ngrok http 3001

# Dùng URL ngrok để chia sẻ
```

## Tài Khoản Demo
Password: `password123`
- alice, bob, carol, david, emma, frank, grace, henry

## Chi Phí
- Railway: **Miễn phí** (500h/tháng, đủ cho 1 server)
- Ngrok: Miễn phí (URL ngẫu nhiên, reset mỗi lần restart)
