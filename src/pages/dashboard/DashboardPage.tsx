import { useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useDashboardStore } from '@/app/store/dashboard-store';
import { useToastsStore } from '@/app/store/toasts-store';
import { Card } from '@/shared/ui/card/Card';
import { Skeleton } from '@/shared/ui/skeleton/Skeleton';
import { WS_URL } from '@/shared/lib/constants';
import { apiFetch } from '@/shared/api/client';
import { useSettingsStore } from '@/app/store/settings-store';
import { useAuthStore } from '@/app/store/auth-store';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user } = useAuthStore();
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const settings = useSettingsStore((s) => s.settings);
  const { stats, chartData, loading, error, fetchStats, fetchChart, setStats } = useDashboardStore();
  const addToast = useToastsStore((s) => s.addToast);

  useEffect(() => {
    fetchStats().catch(() => {});
    fetchChart().catch(() => {});
  }, [fetchStats, fetchChart, settings.defaultPeriod]);

  useEffect(() => {
    if (!user || !WS_URL) return;
    let cancelled = false;
    let ws: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    const connect = async () => {
      try {
        const { ticket } = await apiFetch<{ ticket: string }>('/auth/ws-ticket', { method: 'POST' });
        if (cancelled) return;
        ws = new WebSocket(`${WS_URL}?ticket=${encodeURIComponent(ticket)}`);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'stats-update' && data.payload) setStats(data.payload);
            if (data.type === 'notification' && data.message) addToast(data.message, 'info');
          } catch { /* Ignore malformed messages. */ }
        };
        ws.onclose = () => { if (!cancelled) retry = setTimeout(connect, 5000); };
      } catch { if (!cancelled) retry = setTimeout(connect, 5000); }
    };
    void connect();
    return () => { cancelled = true; clearTimeout(retry); ws?.close(); };
  }, [user, setStats, addToast]);

  if (error) {
    return (
      <div className={styles.errorBlock} role="alert">
        {error}
      </div>
    );
  }

  const widgets = stats
    ? [
        { label: 'Пользователи', value: stats.usersCount },
        { label: 'Заказы', value: stats.ordersCount },
        { label: 'Выручка', value: `₽${stats.revenue.toLocaleString()}` },
        { label: 'Активные', value: stats.activeUsers },
        { label: 'Новые заказы', value: stats.newOrders },
        { label: 'Конверсия %', value: stats.conversionRate },
      ]
    : [];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{settings.dashboardName}</h1>

      {loading && !stats ? (
        <div className={styles.widgets}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton height={48} />
              <Skeleton width="60%" height={24} />
            </Card>
          ))}
        </div>
      ) : (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Метрики</h2>
          <div className={styles.widgets}>
            {widgets.map((w) => (
              <Card key={w.label}>
                <div className={styles.widgetValue}>{w.value}</div>
                <div className={styles.widgetLabel}>{w.label}</div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {chartData && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Графики — {{ day: 'день', week: 'неделя', month: 'месяц' }[settings.defaultPeriod]}</h2>
          <div className={styles.charts}>
            <Card title="Линейный график" className={styles.chartCard}>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData.line}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text-secondary)" opacity={0.3} />
                    <XAxis dataKey="month" stroke="var(--color-text-secondary)" />
                    <YAxis stroke="var(--color-text-secondary)" />
                    <Tooltip
                      itemStyle={{ color: 'var(--color-text)' }}
                      labelStyle={{ color: 'var(--color-text)' }}
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        borderRadius: 'var(--radius-btn)',
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--color-link)" strokeWidth={2} isAnimationActive={!reducedMotion} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Столбчатая диаграмма" className={styles.chartCard}>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData.bar}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text-secondary)" opacity={0.3} />
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                    <YAxis stroke="var(--color-text-secondary)" />
                    <Tooltip
                      itemStyle={{ color: 'var(--color-text)' }}
                      labelStyle={{ color: 'var(--color-text)' }}
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        borderRadius: 'var(--radius-btn)',
                      }}
                    />
                    <Bar dataKey="value" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} isAnimationActive={!reducedMotion} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </section>
      )}

      {!stats && !loading && (
        <div className={styles.empty}>
          <p>Нет данных для отображения</p>
        </div>
      )}
    </div>
  );
}
