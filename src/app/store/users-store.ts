import { create } from 'zustand';
import { apiFetch } from '@/shared/api/client';
import { useAuthStore } from './auth-store';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UsersResponse {
  items: UserRow[];
  total: number;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

interface UsersState {
  items: UserRow[];
  total: number;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  selectedIds: number[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  setPage: (page: number) => void;
  setSort: (sort: string) => void;
  toggleOrder: () => void;
  toggleSelect: (id: number) => void;
  toggleSelectAll: () => void;
  removeSelected: () => void;
  clearError: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  sort: 'name',
  order: 'asc',
  selectedIds: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const { page, limit, sort, order } = get();
      const q = new URLSearchParams({ page: String(page), limit: String(limit), sort, order });
      const data = await apiFetch<UsersResponse>(`/users?${q}`, { token });
      set({
        items: data.items,
        total: data.total,
        page: data.page,
        limit: data.limit,
        sort: data.sort,
        order: data.order,
        loading: false,
        error: null,
      });
    } catch (e) {
      const isUnauthorized = e instanceof Error && e.message === 'UNAUTHORIZED';
      set({
        loading: false,
        error: isUnauthorized ? null : (e instanceof Error ? e.message : 'Ошибка загрузки'),
      });
      if (isUnauthorized) {
        useAuthStore.getState().logout();
      }
      throw e;
    }
  },

  setPage: (page) => set({ page }),

  setSort: (sort) => {
    const { sort: currentSort, order } = get();
    set({ sort, order: currentSort === sort && order === 'asc' ? 'desc' : 'asc' });
  },

  toggleOrder: () => set((s) => ({ order: s.order === 'asc' ? 'desc' : 'asc' })),

  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id],
    })),

  toggleSelectAll: () => {
    const { items, selectedIds } = get();
    const allIds = items.map((u) => u.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    set({ selectedIds: allSelected ? [] : allIds });
  },

  removeSelected: () => {
    const { selectedIds, items } = get();
    if (selectedIds.length === 0) return;
    set({
      items: items.filter((u) => !selectedIds.includes(u.id)),
      total: get().total - selectedIds.length,
      selectedIds: [],
    });
  },

  clearError: () => set({ error: null }),
}));
