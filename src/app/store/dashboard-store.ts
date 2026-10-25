import { useSettingsStore } from './settings-store';
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
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  fetchChart: () => Promise<void>;
  setStats: (stats: DashboardStats) => void;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  chartData: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    if (!useAuthStore.getState().user) return;
    set({ loading: true, error: null });
    try {
      const stats = await apiFetch<DashboardStats>('/dashboard/stats');
      set({ stats, loading: false, error: null });
    } catch (e) {
      const isUnauthorized = e instanceof Error && e.message === 'UNAUTHORIZED';
      set({
        loading: false,
        error: isUnauthorized ? null : (e instanceof Error ? e.message : 'Ошибка загрузки'),
      });
      if (isUnauthorized) {
        useAuthStore.setState({ user: null });
      }
      throw e;
    }
  },

  fetchChart: async () => {
    if (!useAuthStore.getState().user) return;
    try {
      const chartData = await apiFetch<ChartData>(`/dashboard/chart?period=${useSettingsStore.getState().settings.defaultPeriod}`);
      set({ chartData });
    } catch {
      set({ chartData: null });
    }
  },

  setStats: (stats) => set({ stats: stats ?? get().stats }),

  clearError: () => set({ error: null }),
}));
