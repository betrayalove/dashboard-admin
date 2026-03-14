import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastList } from '@/features/toast/ToastList';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <ToastList />
    </div>
  );
}
