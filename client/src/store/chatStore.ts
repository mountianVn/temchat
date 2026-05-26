import { create } from 'zustand';
import { api } from '@/api';
import { socketService } from '@/services/socketService';
import type { Message, Conversation, Group, ActiveChat, GroupMember } from '@/types';

interface ChatState {
  conversations: Conversation[];
  groups: Group[];
  activeChat: ActiveChat | null;
  messages: Record<number, Message[]>;
  typingUsers: Record<string, string[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  loadConversations: () => Promise<void>;
  loadGroups: () => Promise<void>;
  loadMessages: (type: 'conversation' | 'group', id: number) => Promise<void>;
  setActiveChat: (chat: ActiveChat | null) => void;
  sendMessage: (content: string) => void;
  sendFile: (files: File[]) => void;
  addMessage: (message: Message) => void;
  setTyping: (type: 'conversation' | 'group', id: number, userId: number, typing: boolean) => void;
  markAsRead: (type: 'conversation' | 'group', id: number) => void;
  createConversation: (userId: number) => Promise<Conversation>;
  createGroup: (data: { name: string; description?: string; memberIds: number[] }) => Promise<Group>;
  updateGroup: (id: number, data: { name?: string; description?: string }) => Promise<void>;
  addGroupMember: (groupId: number, userId: number) => Promise<void>;
  removeGroupMember: (groupId: number, userId: number) => Promise<void>;
  pinMessage: (messageId: number, groupId: number) => Promise<boolean>;
  updateConversationUnread: (convId: number, delta: number) => void;
  updateGroupLastMessage: (groupId: number, message: string, time: string) => void;
  updateConversationLastMessage: (convId: number, message: string, time: string) => void;
  refreshConversations: () => Promise<void>;
  refreshGroups: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  groups: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  isLoadingConversations: false,
  isLoadingMessages: false,

  loadConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const conversations = await api.conversations.list();
      set({ conversations, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  loadGroups: async () => {
    try {
      const groups = await api.groups.list();
      set({ groups });
    } catch (e) {
      console.error('Failed to load groups', e);
    }
  },

  loadMessages: async (type, id) => {
    set({ isLoadingMessages: true });
    try {
      const msgs = type === 'conversation'
        ? await api.conversations.getMessages(id)
        : await api.groups.getMessages(id);
      set((state) => ({
        messages: { ...state.messages, [id]: msgs },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat });
    if (chat) {
      const { conversations, groups } = get();
      if (chat.type === 'conversation') {
        const conv = conversations.find(c => c.id === chat.id);
        if (conv) {
          get().markAsRead('conversation', chat.id);
        }
      }
      if (chat.type === 'group') {
        get().markAsRead('group', chat.id);
      }
    }
  },

  sendMessage: (content) => {
    const { activeChat } = get();
    if (!activeChat || !content.trim()) return;

    socketService.sendMessage({
      content,
      conversation_id: activeChat.type === 'conversation' ? activeChat.id : undefined,
      group_id: activeChat.type === 'group' ? activeChat.id : undefined,
    });
  },

  sendFile: async (files) => {
    const { activeChat } = get();
    if (!activeChat || files.length === 0) return;

    try {
      await api.messages.uploadFiles({
        conversation_id: activeChat.type === 'conversation' ? activeChat.id : undefined,
        group_id: activeChat.type === 'group' ? activeChat.id : undefined,
        files,
      });
    } catch (e) {
      console.error('Failed to upload files', e);
    }
  },

  addMessage: (message) => {
    const key = message.conversation_id || message.group_id;
    if (!key) return;

    set((state) => {
      const existing = state.messages[key] || [];
      if (existing.some(m => m.id === message.id)) return state;

      const updated = [...existing, message];
      return { messages: { ...state.messages, [key]: updated } };
    });
  },

  setTyping: (type, id, userId, typing) => {
    const key = `${type}:${id}`;
    set((state) => {
      const current = state.typingUsers[key] || [];
      if (typing && !current.includes(String(userId))) {
        return { typingUsers: { ...state.typingUsers, [key]: [...current, String(userId)] } };
      }
      if (!typing) {
        return { typingUsers: { ...state.typingUsers, [key]: current.filter(uid => uid !== String(userId)) } };
      }
      return state;
    });
  },

  markAsRead: (type, id) => {
    socketService.markRead(
      type === 'conversation' ? { conversation_id: id } : { group_id: id }
    );
  },

  createConversation: async (userId) => {
    const conv = await api.conversations.create(userId);
    set((state) => ({
      conversations: [conv, ...state.conversations],
    }));
    return conv;
  },

  createGroup: async (data) => {
    const group = await api.groups.create(data);
    set((state) => ({
      groups: [group, ...state.groups],
    }));
    return group;
  },

  updateGroup: async (id, data) => {
    await api.groups.update(id, data);
    set((state) => ({
      groups: state.groups.map(g => g.id === id ? { ...g, ...data } : g),
      activeChat: state.activeChat?.id === id && state.activeChat.type === 'group'
        ? { ...state.activeChat, ...data }
        : state.activeChat,
    }));
  },

  addGroupMember: async (groupId, userId) => {
    await api.groups.addMember(groupId, userId);
    const group = await api.groups.get(groupId);
    set((state) => ({
      groups: state.groups.map(g => g.id === groupId ? { ...g, members: group.members } : g),
      activeChat: state.activeChat?.id === groupId ? { ...state.activeChat, members: group.members } : state.activeChat,
    }));
  },

  removeGroupMember: async (groupId, userId) => {
    await api.groups.removeMember(groupId, userId);
    set((state) => ({
      groups: state.groups.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, members: g.members?.filter(m => m.id !== userId) };
      }),
      activeChat: state.activeChat?.id === groupId && state.activeChat.type === 'group'
        ? { ...state.activeChat, members: state.activeChat.members?.filter(m => m.id !== userId) }
        : state.activeChat,
    }));
  },

  pinMessage: async (messageId, groupId) => {
    const result = await api.messages.pin(messageId, groupId);
    set((state) => {
      const msgs = state.messages[groupId] || [];
      return {
        messages: {
          ...state.messages,
          [groupId]: msgs.map(m =>
            m.id === messageId ? { ...m, is_pinned: result.pinned ? 1 : 0 } : m
          ),
        },
      };
    });
    return result.pinned;
  },

  updateConversationUnread: (convId, delta) => {
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.id === convId ? { ...c, unreadCount: Math.max(0, c.unreadCount + delta) } : c
      ),
    }));
  },

  updateGroupLastMessage: (groupId, message, time) => {
    set((state) => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, lastMessage: message, lastMessageAt: time } : g
      ),
    }));
  },

  updateConversationLastMessage: (convId, message, time) => {
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.id === convId ? { ...c, lastMessage: message, lastMessageAt: time } : c
      ),
    }));
  },

  refreshConversations: () => get().loadConversations(),
  refreshGroups: () => get().loadGroups(),
}));
