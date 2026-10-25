import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { UsersTablePage } from './UsersTablePage';
import { useAuthStore } from '@/app/store/auth-store';
import { useUsersStore } from '@/app/store/users-store';

const mockUsers = [
  { id: 1, name: 'Alice', email: 'a@test.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 2, name: 'Bob', email: 'b@test.com', role: 'user', createdAt: '2024-02-01' },
];

beforeEach(() => {
  useAuthStore.setState({ user: { id: 1, login: 'admin', name: 'Admin', role: 'admin' } });
  useUsersStore.setState({
    items: [...mockUsers],
    total: 2,
    page: 1,
    limit: 10,
    sort: 'name',
    order: 'asc',
    selectedIds: [],
  });
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ items: mockUsers, total: 2, page: 1, limit: 10, sort: 'name', order: 'asc' }),
  });
});

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('UsersTablePage', () => {
  it('отображает строки таблицы и сортировку по заголовку', async () => {
    wrap(<UsersTablePage />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    const nameHeader = screen.getByRole('button', { name: /имя/i });
    await userEvent.click(nameHeader);

    expect(useUsersStore.getState().sort).toBe('name');
    expect(['asc', 'desc']).toContain(useUsersStore.getState().order);
  });

  it('кнопка «Удалить выбранные» появляется при выборе и удаляет строки, показывает toast', async () => {
    const { getState: getToasts } = await import('@/app/store/toasts-store').then((m) => m.useToastsStore);

    wrap(<UsersTablePage />);

    const checkbox1 = screen.getByRole('checkbox', { name: /выбрать alice/i });
    await userEvent.click(checkbox1);

    const removeBtn = screen.getByRole('button', { name: /удалить выбранные/i });
    expect(removeBtn).toBeInTheDocument();

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ deleted: 1, total: 1 }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ items: [mockUsers[1]], total: 1, page: 1, limit: 10, sort: 'name', order: 'asc' }) });
    await userEvent.click(removeBtn);
    await waitFor(() => expect(useUsersStore.getState().items).toHaveLength(1));

    expect(useUsersStore.getState().items).toHaveLength(1);
    expect(useUsersStore.getState().items[0].name).toBe('Bob');
    expect(useUsersStore.getState().selectedIds).toHaveLength(0);
    expect(getToasts().toasts.some((t) => /удалено|записей/i.test(t.message))).toBe(true);
  });
});
