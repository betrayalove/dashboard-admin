import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';
import { Button } from '@/shared/ui/button/Button';
import styles from './Header.module.css';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <a href="/" className={styles.link} onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            Дашборд
          </a>
          <a href="/users" className={styles.link} onClick={(e) => { e.preventDefault(); navigate('/users'); }}>
            Пользователи
          </a>
          <a href="/settings" className={styles.link} onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
            Настройки
          </a>
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
