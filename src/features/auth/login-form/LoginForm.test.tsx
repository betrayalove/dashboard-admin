import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { useAuthStore } from '@/app/store/auth-store';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function wrap(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

beforeEach(() => {
  useAuthStore.getState().logout();
  (global.fetch as jest.Mock).mockReset();
  mockNavigate.mockClear();
});

describe('LoginForm', () => {
  it('при успешном ответе сохраняет токен и редиректит на /', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'fake-token', user: { id: 1, login: 'admin', name: 'Admin', role: 'admin' } }),
    });

    wrap(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/логин/i), 'admin');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'admin');
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('fake-token');
      expect(useAuthStore.getState().user?.login).toBe('admin');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('при ошибке показывает сообщение на форме', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    wrap(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/логин/i), 'wrong');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid|ошибка|credentials/i);
    });
  });
});
