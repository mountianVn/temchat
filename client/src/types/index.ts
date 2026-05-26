export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  role: string;
  department: string;
  bio: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  last_seen?: string;
}

export interface Message {
  id: number;
  conversation_id?: number;
  group_id?: number;
  sender_id: number;
  content: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  is_pinned?: number;
  read_at?: string;
  created_at: string;
  sender?: {
    username: string;
    display_name: string;
    avatar: string;
    role: string;
  };
}

export interface Conversation {
  id: number;
  type: 'direct';
  name: string;
  avatar: string;
  username?: string;
  role?: string;
  status?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Group {
  id: number;
  name: string;
  avatar: string;
  description?: string;
  myRole?: 'admin' | 'member';
  memberCount?: number;
  members?: GroupMember[];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface GroupMember extends User {
  member_role: 'admin' | 'member';
  joined_at?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'message' | 'mention' | 'group_invite' | 'group_add';
  title: string;
  body?: string;
  link?: string;
  is_read: number;
  created_at: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface ActiveChat {
  type: 'conversation' | 'group';
  id: number;
  name: string;
  avatar?: string;
  status?: string;
  myRole?: 'admin' | 'member';
  members?: GroupMember[];
}
