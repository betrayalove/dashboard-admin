import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { useAuthStore } from '@/app/store/auth-store';
import { useDashboardStore } from '@/app/store/dashboard-store';

jest.mock('@/shared/lib/constants', () => ({ WS_URL: '' }));

jest.mock('recharts', () => ({
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  BarChart: () => null,
  Bar: () => null,
}));

beforeEach(() => {
  useAuthStore.setState({ user: { id: 1, login: 'admin', name: 'Admin', role: 'admin' } });
  useDashboardStore.setState({ stats: null, chartData: null });
  (global.fetch as jest.Mock).mockReset();
});

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DashboardPage', () => {
  it('рендерит виджеты с цифрами после загрузки', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          usersCount: 100,
          ordersCount: 200,
          revenue: 50000,
          activeUsers: 80,
          newOrders: 10,
          conversionRate: 4.5,
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ line: [], bar: [] }) });

    wrap(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });
    expect(screen.getByText('Пользователи')).toBeInTheDocument();
    expect(screen.getByText('Заказы')).toBeInTheDocument();
  });
});
