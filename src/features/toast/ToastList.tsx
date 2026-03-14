import { useToastsStore } from '@/app/store/toasts-store';
import styles from './ToastList.module.css';

export function ToastList() {
  const toasts = useToastsStore((s) => s.toasts);
  const removeToast = useToastsStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} role="region" aria-label="Уведомления">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${t.type ? styles[t.type] : ''}`}
          role="status"
        >
          <span className={styles.message}>{t.message}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => removeToast(t.id)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
