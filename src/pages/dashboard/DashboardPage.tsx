import { useEffect, useRef } from 'react';
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
import { useAuthStore } from '@/app/store/auth-store';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { token } = useAuthStore();
  const { stats, chartData, loading, error, fetchStats, fetchChart, setStats } = useDashboardStore();
  const addToast = useToastsStore((s) => s.addToast);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchStats().catch(() => {});
    fetchChart().catch(() => {});
  }, [fetchStats, fetchChart]);

  useEffect(() => {
    if (!token || !WS_URL) return;
    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'stats-update' && data.payload) {
          setStats(data.payload);
        }
        if (data.type === 'notification' && data.message) {
          addToast(data.message, 'info');
        }
      } catch {}
    };

    ws.onerror = () => {};
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, setStats, addToast]);

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
      <h1 className={styles.title}>Дашборд</h1>

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
          <h2 className={styles.sectionTitle}>Графики</h2>
          <div className={styles.charts}>
            <Card title="Линейный график" className={styles.chartCard}>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData.line}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text-secondary)" opacity={0.3} />
                    <XAxis dataKey="month" stroke="var(--color-text-secondary)" />
                    <YAxis stroke="var(--color-text-secondary)" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-secondary)',
                        borderRadius: 'var(--radius-btn)',
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} />
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
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-secondary)',
                        borderRadius: 'var(--radius-btn)',
                      }}
                    />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
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
