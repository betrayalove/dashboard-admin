import { create } from 'zustand';
import { apiFetch } from '@/shared/api/client';
import { useAuthStore } from './auth-store';

export interface DashboardStats {
  usersCount: number;
  ordersCount: number;
  revenue: number;
  activeUsers: number;
  newOrders: number;
  conversionRate: number;
}

export interface ChartPoint {
  month?: string;
  name?: string;
  value: number;
}

export interface ChartData {
  line: ChartPoint[];
  bar: ChartPoint[];
}

interface DashboardState {
  stats: DashboardStats | null;
  chartData: ChartData | null;
  period: string;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  fetchChart: () => Promise<void>;
  setStats: (stats: DashboardStats) => void;
  setPeriod: (period: string) => void;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  chartData: null,
  period: 'week',
  loading: false,
  error: null,

  fetchStats: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const stats = await apiFetch<DashboardStats>('/dashboard/stats', { token });
      set({ stats, loading: false, error: null });
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

  fetchChart: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const chartData = await apiFetch<ChartData>('/dashboard/chart', { token });
      set({ chartData });
    } catch {
      set({ chartData: null });
    }
  },

  setStats: (stats) => set({ stats: stats ?? get().stats }),

  setPeriod: (period) => set({ period }),

  clearError: () => set({ error: null }),
}));
