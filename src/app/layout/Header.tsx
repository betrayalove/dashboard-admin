import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { useToastsStore } from '@/app/store/toasts-store';
import { Button } from '@/shared/ui/button/Button';
import styles from './Header.module.css';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToastsStore((s) => s.addToast);

  const handleLogout = async () => {
    try { await logout(); } catch { addToast('Не удалось выйти. Повторите попытку.', 'error'); return; }
    navigate('/login', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <NavLink to="/" end className={styles.link}>Дашборд</NavLink>
          <NavLink to="/users" className={styles.link}>Пользователи</NavLink>
          <NavLink to="/settings" className={styles.link}>Настройки</NavLink>
        </nav>
        <div className={styles.user}>
          <span className={styles.userName}>{user?.name ?? user?.login}</span>
          <Button variant="ghost" onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
