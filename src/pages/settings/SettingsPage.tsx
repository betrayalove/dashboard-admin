import { useState, type FormEvent } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';
import { useToastsStore } from '@/app/store/toasts-store';
import styles from './SettingsPage.module.css';

import { useSettingsStore, type SettingsState } from '@/app/store/settings-store';

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(useSettingsStore.getState().settings);
  const addToast = useToastsStore((s) => s.addToast);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      useSettingsStore.getState().save(settings);
      addToast('Настройки сохранены', 'success');
    } catch { addToast('Не удалось сохранить настройки', 'error'); }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Настройки</h1>

      <Card className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Название дашборда"
            maxLength={80}
            value={settings.dashboardName}
            onChange={(e) => setSettings((s) => ({ ...s, dashboardName: e.target.value }))}
            placeholder="Дашборд"
          />
          <div className={styles.field}>
            <label htmlFor="period" className={styles.label}>Период по умолчанию</label>
            <select
              className={styles.select}
              id="period"
              value={settings.defaultPeriod}
              onChange={(e) => setSettings((s) => ({ ...s, defaultPeriod: e.target.value as SettingsState['defaultPeriod'] }))}
            >
              <option value="day">День</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="theme" className={styles.label}>Тема</label>
            <select
              className={styles.select}
              id="theme"
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
