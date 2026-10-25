import { create } from 'zustand';

export interface SettingsState { dashboardName: string; defaultPeriod: 'day' | 'week' | 'month'; theme: 'light' | 'dark' }
const defaults: SettingsState = { dashboardName: 'Дашборд', defaultPeriod: 'week', theme: 'light' };
function load(): SettingsState {
  try {
    const value = JSON.parse(localStorage.getItem('dashboard_settings') || '{}');
    return {
      dashboardName: typeof value.dashboardName === 'string' && value.dashboardName.trim() ? value.dashboardName.trim().slice(0, 80) : defaults.dashboardName,
      defaultPeriod: ['day', 'week', 'month'].includes(value.defaultPeriod) ? value.defaultPeriod : defaults.defaultPeriod,
      theme: value.theme === 'dark' ? 'dark' : 'light',
    };
  } catch { return defaults; }
}
export const useSettingsStore = create<{ settings: SettingsState; save: (settings: SettingsState) => void }>((set) => ({
  settings: load(),
  save: (settings) => {
    const normalized = { ...settings, dashboardName: settings.dashboardName.trim().slice(0, 80) || defaults.dashboardName };
    localStorage.setItem('dashboard_settings', JSON.stringify(normalized));
    document.documentElement.dataset.theme = normalized.theme;
    set({ settings: normalized });
  },
}));
document.documentElement.dataset.theme = useSettingsStore.getState().settings.theme;
