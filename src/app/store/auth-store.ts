import { create } from 'zustand';
import { apiFetch } from '@/shared/api/client';
import { logoutApi } from '@/shared/auth/token';

export interface User {
  id: number;
  login: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  initFromStorage: async () => {
    const { checkAuth } = await import('@/shared/auth/token');
    const data = await checkAuth();
    if (data) set({ token: data.token, user: data.user });
  },

  login: async (loginName: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: loginName, password }),
      });
      set({ token: data.token, user: data.user, loading: false, error: null });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Ошибка входа',
      });
      throw e;
    }
  },

  logout: async () => {
    await logoutApi();
    set({ token: null, user: null });
  },
}));
