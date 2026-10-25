import { create } from 'zustand';
import { apiFetch } from '@/shared/api/client';
import { logoutApi, checkAuth } from '@/shared/auth/token';

export interface User {
  id: number;
  login: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  initializing: true,
  user: null,
  loading: false,
  error: null,

  initFromStorage: async () => {
    const data = await checkAuth();
    set({ user: data?.user || null, initializing: false });
  },

  login: async (loginName: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: loginName, password }),
      });
      set({ user: data.user, initializing: false, loading: false, error: null });
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
    set({ user: null });
  },
}));
