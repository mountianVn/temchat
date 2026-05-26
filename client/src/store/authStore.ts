import { create } from 'zustand';
import { api } from '@/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; display_name: string; department?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  updateAvatar: (avatar: string) => void;
  updateStatus: (status: User['status']) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.auth.login(username, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.auth.register(data);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const user = await api.auth.me();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  updateProfile: (data) => {
    const user = get().user;
    if (user) {
      const updated = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated as User });
    }
  },

  updateAvatar: (avatar) => {
    const user = get().user;
    if (user) {
      const updated = { ...user, avatar };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated as User });
    }
  },

  updateStatus: (status) => {
    const user = get().user;
    if (user) {
      const updated = { ...user, status };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated as User });
    }
  },

  clearError: () => set({ error: null }),
}));
