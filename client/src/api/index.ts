const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    register: (data: { username: string; password: string; display_name: string; department?: string }) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<any>('/auth/me'),

    changePassword: (currentPassword: string, newPassword: string) =>
      request('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  users: {
    list: (params?: { search?: string; department?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/users${query ? `?${query}` : ''}`);
    },

    get: (id: number) => request<any>(`/users/${id}`),

    update: (id: number, data: Partial<any>) =>
      request<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    uploadAvatar: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return request<{ avatar: string }>(`/users/${id}/avatar`, {
        method: 'POST',
        headers: {},
        body: formData as any,
      });
    },

    updateStatus: (id: number, status: string) =>
      request<any>(`/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    getDepartments: () => request<string[]>('/users/departments'),
  },

  conversations: {
    list: () => request<any[]>('/conversations'),

    getMessages: (id: number, params?: { limit?: number; before?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/conversations/${id}/messages${query ? `?${query}` : ''}`);
    },

    create: (userId: number) =>
      request<any>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),

    markRead: (id: number) =>
      request(`/conversations/${id}/read`, { method: 'POST' }),
  },

  messages: {
    create: (data: { conversation_id?: number; group_id?: number; content: string }) =>
      request<any>('/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    uploadFiles: async (data: { conversation_id?: number; group_id?: number; content?: string; files: File[] }) => {
      const formData = new FormData();
      if (data.conversation_id) formData.append('conversation_id', String(data.conversation_id));
      if (data.group_id) formData.append('group_id', String(data.group_id));
      if (data.content) formData.append('content', data.content);
      data.files.forEach(f => formData.append('files', f));

      const token = getToken();
      const response = await fetch(`${API_BASE}/messages/file`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      return response.json();
    },

    pin: (id: number, groupId: number) =>
      request<{ pinned: boolean }>(`/messages/${id}/pin`, {
        method: 'PUT',
        body: JSON.stringify({ group_id: groupId }),
      }),

    getPinned: (groupId: number) =>
      request<any[]>(`/messages/pinned/${groupId}`),
  },

  groups: {
    list: () => request<any[]>('/groups'),

    get: (id: number) => request<any>(`/groups/${id}`),

    getMessages: (id: number, params?: { limit?: number; before?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/groups/${id}/messages${query ? `?${query}` : ''}`);
    },

    create: (data: { name: string; description?: string; memberIds: number[] }) =>
      request<any>('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: { name?: string; description?: string }) =>
      request<any>(`/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    uploadAvatar: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return request<{ avatar: string }>(`/groups/${id}/avatar`, {
        method: 'POST',
        headers: {},
        body: formData as any,
      });
    },

    delete: (id: number) =>
      request(`/groups/${id}`, { method: 'DELETE' }),

    addMember: (groupId: number, userId: number) =>
      request<any>(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),

    removeMember: (groupId: number, userId: number) =>
      request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () => request<any[]>('/notifications'),

    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),

    markRead: (id: number) =>
      request(`/notifications/${id}/read`, { method: 'PUT' }),

    markAllRead: () =>
      request('/notifications/read-all', { method: 'PUT' }),
  },
};
