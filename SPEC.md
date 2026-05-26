# Internal Chat App - Project Specification

## 1. Concept & Vision

A professional internal communication platform for technical teams, blending the speed of real-time messaging with the organizational power of group channels. The app feels like a blend of Discord's chat fluidity, Teams' professional tone, and Telegram's clean interface — fast, modern, and distraction-free. Built for developers who demand speed and reliability.

## 2. Design Language

### Aesthetic Direction
Dark-first professional chat application inspired by Discord/Teams hybrid. Clean lines, generous spacing, subtle depth through shadows and borders.

### Color Palette
- **Primary**: `#5865F2` (Discord-like blue)
- **Primary Hover**: `#4752C4`
- **Success**: `#23A55A`
- **Warning**: `#F0B232`
- **Danger**: `#F23F43`
- **Background Dark**: `#1E1F22`
- **Surface Dark**: `#2B2D31`
- **Surface Darker**: `#232428`
- **Border Dark**: `#313338`
- **Text Primary Dark**: `#F2F3F5`
- **Text Secondary Dark**: `#B5BAC1`
- **Text Muted Dark**: `#6D6F78`
- **Background Light**: `#F8F9FA`
- **Surface Light**: `#FFFFFF`
- **Border Light**: `#E3E5E8`
- **Text Primary Light**: `#060607`
- **Text Secondary Light**: `#2E3338`

### Typography
- **Font**: Inter (Google Fonts) with system fallbacks
- **Scale**: 12px (xs), 13px (sm), 14px (base), 16px (md), 18px (lg), 24px (xl), 32px (2xl)

### Spatial System
- 4px base unit: 4, 8, 12, 16, 20, 24, 32, 48, 64
- Border radius: 4px (sm), 8px (md), 12px (lg), 9999px (pill)

### Motion Philosophy
- Transitions: 150ms ease for micro-interactions, 250ms ease-out for panels
- Sidebar slide: 250ms cubic-bezier(0.4, 0, 0.2, 1)
- Message appear: fade + slide up 8px, 200ms
- Notification pulse: subtle glow animation

## 3. Layout & Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Header (56px)  ─  Conversation name / Search / Menu / Call  │
├───────────┬────────────────────────────────┬─────────────────┤
│  Sidebar  │     Chat Area (messages)       │   Right Panel   │
│  (240px)  │                                │    (280px)      │
│           │                                │                 │
│  - Logo   │                                │  - User info    │
│  - Search │                                │  - Members      │
│  - DMs    │                                │  - Files        │
│  - Groups │                                │  - Pinned msgs  │
│           │                                │                 │
├───────────┴────────────────────────────────┴─────────────────┤
│  Input Area (auto)  ─  Textarea / Emoji / Attach / Send     │
└──────────────────────────────────────────────────────────────┘
```

- Left sidebar collapsible on mobile
- Right panel collapsible, hidden by default on mobile
- Responsive breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

## 4. Features & Interactions

### Authentication
- Login with username + password, JWT stored in localStorage
- Register with username, password, display name, department
- Protected routes redirect to login
- Auto-logout on token expiry

### User Management
- Profile: avatar (upload), display name, role, department, bio
- Status: Online (green), Away (yellow), Busy (red), Offline (gray)
- Automatic status based on activity

### Contact List
- Filter by name or department
- Click to open DM conversation
- Unread message badge with count
- Last message preview

### Direct Messages
- Real-time message delivery via Socket.IO
- Read receipts (single/double checkmark)
- Typing indicator
- File/image attachments with preview
- Message timestamps (relative + absolute on hover)
- Scroll to bottom on new message

### Group Chats
- Create group with name, avatar, members
- Add/remove members
- Change group name and avatar (admin)
- Pin important messages
- View pinned messages in right panel

### Notifications
- Browser notifications for background messages
- In-app notification bell with badge count
- Notification when mentioned (@username)
- Toast notifications for new DMs

## 5. Component Inventory

| Component | States |
|-----------|--------|
| Button | default, hover, active, disabled, loading |
| Input | default, focus, error, disabled |
| Avatar | online, offline, typing, with badge |
| Message | sent, delivered, read, own, foreign |
| Sidebar Item | default, active, hover, unread |
| Modal | open, closing |
| Toast | success, error, info, warning |
| Dropdown | closed, open |
| Emoji Picker | closed, open |
| File Preview | image, document, loading |

## 6. Technical Approach

### Frontend
- React 18 + TypeScript
- Vite 5 build tool
- TailwindCSS 3
- Zustand for state management
- Socket.IO-client for realtime
- React Router 6 for navigation
- date-fns for time formatting

### Backend
- Node.js 18+ with Express 4
- Socket.IO 4 for WebSocket
- better-sqlite3 for SQLite
- bcrypt for password hashing
- jsonwebtoken for JWT
- multer for file uploads
- express-validator for input validation

### API Design
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
PUT    /api/users/:id/avatar

GET    /api/conversations
GET    /api/conversations/:id/messages
POST   /api/messages

GET    /api/groups
POST   /api/groups
PUT    /api/groups/:id
DELETE /api/groups/:id
POST   /api/groups/:id/members
DELETE /api/groups/:id/members/:userId

POST   /api/upload
GET    /uploads/:filename
```

### Socket Events
```
Client → Server:
  join (userId)
  send_message
  typing_start
  typing_stop
  mark_read
  join_group
  leave_group

Server → Client:
  new_message
  user_status
  user_typing
  message_read
  member_joined
  member_left
```

### Data Model
See Database section in requirements. SQLite schema includes:
- users, messages, conversations, groups, group_members, attachments, notifications, pinned_messages
