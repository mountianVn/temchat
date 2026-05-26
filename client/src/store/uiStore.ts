import { create } from 'zustand';
import type { Toast } from '@/types';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  activeRightTab: 'members' | 'files' | 'pinned';
  toasts: Toast[];
  searchQuery: string;
  mobileView: 'chat' | 'sidebar';

  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setActiveRightTab: (tab: 'members' | 'files' | 'pinned') => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setMobileView: (view: 'chat' | 'sidebar') => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  sidebarOpen: true,
  rightPanelOpen: false,
  activeRightTab: 'members',
  toasts: [],
  searchQuery: '',
  mobileView: 'sidebar',

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  setActiveRightTab: (tab) => set({ activeRightTab: tab }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setMobileView: (view) => set({ mobileView: view }),
}));
