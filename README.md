# TeamChat - Internal Chat App

ứng dụng chat nội bộ cho nhóm/nhà máy, realtime, với giao diện Discord/Teams-style.

## Quick Start

**Windows:** Double-click `START.bat`
**Mac/Linux:** `./START.sh`

## Requirements
- Node.js 18+ https://nodejs.org/

## Demo Accounts
Password cho tất cả: `password123`

| Username | Name | Role | Department |
|----------|------|------|------------|
| alice | Alice Johnson | Team Lead | Engineering |
| bob | Bob Chen | Backend Developer | Engineering |
| carol | Carol Williams | Frontend Developer | Engineering |
| david | David Kim | DevOps Engineer | Infrastructure |
| emma | Emma Martinez | Product Manager | Product |
| frank | Frank Thompson | QA Engineer | Engineering |
| grace | Grace Lee | UX Designer | Design |
| henry | Henry Patel | Data Engineer | Data |

## Features
- Real-time 1-on-1 and group chat
- File/image sharing (drag & drop, paste)
- Emoji picker
- Dark/Light theme toggle
- Online status indicators
- Pinned messages (groups)
- User search

## Manual Setup

```bash
# Install dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run servers
npm run dev
```

Or separately:
```bash
cd server && npm run dev   # http://localhost:3001
cd client && npm run dev  # http://localhost:5173
```

## Deploy
See `DEPLOY.md` for cloud deployment (Railway, Render, VPS+Nginx).

## Docs
- `SPEC.md` - Technical specification
- `DEPLOY.md` - Deployment guide
- `README_VI.md` - Hướng dẫn tiếng Việt
