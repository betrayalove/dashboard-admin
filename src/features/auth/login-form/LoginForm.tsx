import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const { login: doLogin, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) return;
    try {
      await doLogin(login.trim(), password);
      navigate('/', { replace: true });
    } catch {
      // error set in store
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate data-testid="login-form">
      <h1 className={styles.title}>Вход</h1>
      {error && (
        <div className={styles.errorBlock} role="alert" data-testid="login-error">
          {error}
        </div>
      )}
      <Input
        label="Логин"
        type="text"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder="admin"
        autoComplete="username"
        disabled={loading}
        data-testid="login-input"
      />
      <Input
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        disabled={loading}
        data-testid="password-input"
      />
      <Button type="submit" fullWidth disabled={loading} data-testid="login-submit">
        {loading ? 'Вход...' : 'Войти'}
      </Button>
    </form>
  );
}
