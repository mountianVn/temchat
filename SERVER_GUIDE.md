# Hướng Dẫn Kết Nối TeamChat Server

## Máy Chủ Đang Chạy

**Địa chỉ:** `http://192.168.0.101:3001`

## Cách Kết Nối

### 1. Từ cùng mạng LAN
Mở trình duyệt và truy cập:
```
http://192.168.0.101:3001
```

### 2. Từ máy khác (cùng mạng)
- Mở trình duyệt
- Gõ địa chỉ: `http://192.168.0.101:3001`
- Đăng nhập với tài khoản demo

## Tài Khoản Demo
Password cho tất cả: `password123`

| Username | Tên |
|----------|------|
| alice | Alice Johnson |
| bob | Bob Chen |
| carol | Carol Williams |
| david | David Kim |
| emma | Emma Martinez |
| frank | Frank Thompson |
| grace | Grace Lee |
| henry | Henry Patel |

## Khắc Phục Lỗi

### Không kết nối được
1. Kiểm tra tường lửa Windows:
   - Mở Windows Firewall
   - Thêm exception cho port **3001** (TCP)

2. Kiểm tra máy chủ đang chạy:
   - Trên máy server, mở trình duyệt: `http://localhost:3001`
   - Nếu không mở được, restart server

### Cách mở tường lửa (Windows)
```powershell
# Chạy PowerShell as Administrator
netsh advfirewall firewall add rule name="TeamChat" dir=in action=allow protocol=tcp localport=3001
```

### Restart Server
```bash
cd C:\Users\PC\OneDrive\Máy tính\app\server
npm run dev
```

## Lưu Ý
- Server sử dụng port **3001**
- Máy khác phải cùng mạng LAN để kết nối trực tiếp
- Muốn kết nối từ internet, cần cấu hình port forwarding trên router

## Tính Năng
- Real-time 1-on-1 and group chat
- File/image sharing
- Emoji picker
- Dark/Light theme
- Online status indicators
- Pinned messages (groups)
- User search
