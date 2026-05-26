# TeamChat - Internal Chat App

Ứng dụng chat nội bộ cho nhóm/nhà máy.

## 🚀 Cách Chạy Nhanh

### Windows
```
1. Double-click file START.bat
2. Trình duyệt tự mở
3. Đăng nhập với tài khoản demo
```

### Mac/Linux
```bash
1. Mở Terminal, cd vào folder app
2. chmod +x START.sh
3. ./START.sh
```

## 📋 Yêu Cầu
- **Node.js** 18+ (tải tại https://nodejs.org/)
- **npm** (đi kèm Node.js)

## 🔐 Demo Accounts

Tất cả dùng password: `password123`

| Username | Tên | Chức vụ | Phòng ban |
|----------|------|----------|------------|
| alice | Alice Johnson | Team Lead | Engineering |
| bob | Bob Chen | Backend Developer | Engineering |
| carol | Carol Williams | Frontend Developer | Engineering |
| david | David Kim | DevOps Engineer | Infrastructure |
| emma | Emma Martinez | Product Manager | Product |
| frank | Frank Thompson | QA Engineer | Engineering |
| grace | Grace Lee | UX Designer | Design |
| henry | Henry Patel | Data Engineer | Data |

## ✨ Tính Năng

- **Chat trực tiếp** - Nhắn tin riêng 1-1
- **Nhóm chat** - Tạo kênh, thêm thành viên
- **Real-time** - Tin nhắn tức thì qua WebSocket
- **File sharing** - Gửi ảnh, document, file
- **Emoji** - Bộ emoji đầy đủ
- **Dark mode** - Chuyển đổi giao diện sáng/tối
- **Trạng thái online** - Biết ai đang online
- **Pinned messages** - Ghim tin nhắn quan trọng
- **Tìm kiếm** - Tìm người dùng, nhóm

## 📂 Cấu Trúc

```
/app
├── client/         # React frontend (Vite)
├── server/          # Node.js backend (Express)
├── uploads/         # File đã upload
├── database/        # SQLite database
├── START.bat        # Script chạy (Windows)
├── START.sh        # Script chạy (Mac/Linux)
├── README.md       # Tài liệu này
├── DEPLOY.md       # Hướng dẫn deploy lên cloud
└── SPEC.md         # Thông số kỹ thuật
```

## 🛠️ Cách Chạy Thủ Công

### Cài đặt (chỉ cần làm 1 lần)
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Chạy
```bash
# Cách 1: Chạy cả hai server
npm run dev

# Cách 2: Chạy riêng
cd server && npm run dev   # http://localhost:3001
cd client && npm run dev   # http://localhost:5173
```

### Truy cập
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## 🔧 Khắc Phục Lỗi

### Lỗi "npm not found"
- Cài Node.js từ https://nodejs.org/

### Lỗi "Port already in use"
```bash
# Windows: Tìm và kill process
netstat -ano | findstr :3001
taskkill /PID <process_id> /F

# Mac/Linux
lsof -i :3001
kill -9 <process_id>
```

### Lỗi database
```bash
# Xóa database cũ và chạy lại
rm database/chat.db
cd server && npm run seed
```

## 🌐 Deploy lên Internet

Xem `DEPLOY.md` để biết cách deploy lên:
- Railway.app (miễn phí)
- Render.com (miễn phí)
- VPS với Nginx

## 📜 License

MIT
