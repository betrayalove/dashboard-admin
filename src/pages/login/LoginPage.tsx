import { LoginForm } from '@/features/auth/login-form/LoginForm';
import styles from './LoginPage.module.css';

export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <LoginForm />
      </div>
    </div>
  );
}
