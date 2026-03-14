import { useState, useEffect, type FormEvent } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';
import { useToastsStore } from '@/app/store/toasts-store';
import styles from './SettingsPage.module.css';

const SETTINGS_KEY = 'dashboard_settings';

export interface SettingsState {
  dashboardName: string;
  defaultPeriod: string;
  theme: 'light' | 'dark';
}

const defaultSettings: SettingsState = {
  dashboardName: 'Дашборд',
  defaultPeriod: 'week',
  theme: 'light',
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return { ...defaultSettings, ...parsed };
    }
  } catch {}
  return defaultSettings;
}

function saveSettings(s: SettingsState) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', s.theme);
  }
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const addToast = useToastsStore((s) => s.addToast);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    addToast('Настройки сохранены', 'success');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Настройки</h1>

      <Card className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Название дашборда"
            value={settings.dashboardName}
            onChange={(e) => setSettings((s) => ({ ...s, dashboardName: e.target.value }))}
            placeholder="Дашборд"
          />
          <div className={styles.field}>
            <label className={styles.label}>Период по умолчанию</label>
            <select
              className={styles.select}
              value={settings.defaultPeriod}
              onChange={(e) => setSettings((s) => ({ ...s, defaultPeriod: e.target.value }))}
            >
              <option value="day">День</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Тема</label>
            <select
              className={styles.select}
              value={settings.theme}
              onChange={(e) =>
                setSettings((s) => ({ ...s, theme: e.target.value as 'light' | 'dark' }))
              }
            >
              <option value="light">Светлая</option>
              <option value="dark">Тёмная</option>
            </select>
          </div>
          <Button type="submit">Сохранить</Button>
        </form>
      </Card>
    </div>
  );
}
