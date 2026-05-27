import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';

class SocketService {
  private socket: Socket | null = null;
  private typingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  connect() {
    const token = useAuthStore.getState().token;
    if (!token || this.socket?.connected) return;

    const wsUrl = import.meta.env.VITE_WS_URL || '/';
    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('new_message', (message) => {
      useChatStore.getState().addMessage(message);
      const activeChat = useChatStore.getState().activeChat;
      const chatKey = message.conversation_id || message.group_id;

      if (activeChat && chatKey === activeChat.id) {
        useChatStore.getState().markAsRead(
          activeChat.type,
          activeChat.id
        );
      } else {
        if (message.conversation_id) {
          useChatStore.getState().updateConversationUnread(message.conversation_id, 1);
        }
      }

      if (message.conversation_id) {
        useChatStore.getState().updateConversationLastMessage(
          message.conversation_id,
          message.content,
          message.created_at
        );
      }
      if (message.group_id) {
        useChatStore.getState().updateGroupLastMessage(
          message.group_id,
          message.content,
          message.created_at
        );
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser && message.sender_id !== currentUser.id) {
        if (document.hidden) {
          this.showNotification(message);
        }

        useUIStore.getState().addToast({
          type: 'info',
          title: message.sender?.display_name || 'New message',
          message: message.content.substring(0, 80),
        });
      }
    });

    this.socket.on('message_sent', (message) => {
      useChatStore.getState().addMessage(message);
    });

    this.socket.on('user_typing', (data) => {
      const activeChat = useChatStore.getState().activeChat;
      const key = data.conversation_id ? `conversation:${data.conversation_id}` : `group:${data.group_id}`;

      if (activeChat && key === `${activeChat.type}:${activeChat.id}`) {
        useChatStore.getState().setTyping(
          activeChat.type,
          activeChat.id,
          data.userId,
          data.typing
        );
      }
    });

    this.socket.on('message_read', (data) => {
      const messages = useChatStore.getState().messages[data.conversation_id];
      if (messages) {
        useChatStore.setState((state) => ({
          messages: {
            ...state.messages,
            [data.conversation_id]: messages.map(m =>
              m.sender_id !== useAuthStore.getState().user?.id ? { ...m, read_at: new Date().toISOString() } : m
            ),
          },
        }));
      }
    });

    this.socket.on('user_status', (data) => {
      const { userId, status } = data;
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.id !== userId) {
        useChatStore.setState((state) => ({
          conversations: state.conversations.map(c =>
            c.type === 'direct' && (c as any).id === userId ? { ...c, status } : c
          ),
        }));
      }
    });

    this.socket.on('member_joined', (data) => {
      const activeChat = useChatStore.getState().activeChat;
      if (activeChat && activeChat.type === 'group' && activeChat.id === data.groupId) {
        useChatStore.getState().refreshGroups();
      }
    });

    this.socket.on('member_left', (data) => {
      const activeChat = useChatStore.getState().activeChat;
      if (activeChat && activeChat.type === 'group' && activeChat.id === data.groupId) {
        useChatStore.getState().removeGroupMember(data.groupId, data.userId);
      }
    });

    this.socket.on('group_updated', (group) => {
      useChatStore.getState().refreshGroups();
      const activeChat = useChatStore.getState().activeChat;
      if (activeChat && activeChat.type === 'group' && activeChat.id === group.id) {
        useChatStore.getState().setActiveChat({ ...activeChat, name: group.name });
      }
    });

    this.socket.on('notification', (notification) => {
      useUIStore.getState().addToast({
        type: notification.type === 'mention' ? 'warning' : 'info',
        title: notification.title,
        message: notification.body,
      });
    });

    this.socket.on('group_deleted', () => {
      useChatStore.getState().refreshGroups();
      const activeChat = useChatStore.getState().activeChat;
      if (activeChat && activeChat.type === 'group') {
        useChatStore.getState().setActiveChat(null);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: number) {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: number) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  joinGroup(groupId: number) {
    this.socket?.emit('join_group', groupId);
  }

  leaveGroup(groupId: number) {
    this.socket?.emit('leave_group', groupId);
  }

  sendMessage(data: { content: string; conversation_id?: number; group_id?: number; file_url?: string; file_type?: string; file_name?: string }) {
    this.socket?.emit('send_message', data);
  }

  startTyping(type: 'conversation' | 'group', id: number) {
    const key = `${type}:${id}`;
    this.socket?.emit('typing_start', type === 'conversation' ? { conversation_id: id } : { group_id: id });

    if (this.typingTimers[key]) {
      clearTimeout(this.typingTimers[key]);
    }

    this.typingTimers[key] = setTimeout(() => {
      this.stopTyping(type, id);
    }, 3000);
  }

  stopTyping(type: 'conversation' | 'group', id: number) {
    const key = `${type}:${id}`;
    if (this.typingTimers[key]) {
      clearTimeout(this.typingTimers[key]);
      delete this.typingTimers[key];
    }
    this.socket?.emit('typing_stop', type === 'conversation' ? { conversation_id: id } : { group_id: id });
  }

  markRead(data: { conversation_id?: number; group_id?: number }) {
    this.socket?.emit('mark_read', data);
  }

  updateStatus(status: string) {
    this.socket?.emit('update_status', { status });
  }

  private showNotification(message: any) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message.sender?.display_name || 'New message', {
        body: message.content.substring(0, 100),
        icon: '/favicon.svg',
        tag: `msg-${message.id}`,
      });
    }
  }
}

export const socketService = new SocketService();
