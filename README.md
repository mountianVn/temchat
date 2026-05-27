# TeamChat - Internal Chat App

A realtime chat application for teams, built with React + Node.js + Socket.io.

## Quick Start

```bash
# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run servers
npm run dev
```

Access at http://localhost:5173

## Demo Accounts
Password: `password123`

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
- File/image sharing
- Emoji picker
- Dark/Light theme
- Online status indicators
- Pinned messages
- User search

## Deploy to Railway

1. Push code to GitHub
2. Go to https://railway.app
3. Connect GitHub repo
4. Railway auto-detects Node.js
5. Set environment variables:
   - `PORT=3001`
   - `JWT_SECRET=your_secret_key`
6. Deploy!

## License
MIT
