import { useUsersStore } from '@/app/store/users-store';
import { useToastsStore } from '@/app/store/toasts-store';
import { Button } from '@/shared/ui/button/Button';
import styles from './RemoveSelectedButton.module.css';

export function RemoveSelectedButton() {
  const { selectedIds, removeSelected, loading } = useUsersStore();
  const addToast = useToastsStore((s) => s.addToast);
  const count = selectedIds.length;

  const handleClick = async () => {
    if (count === 0) return;
    try {
      const deleted = await removeSelected();
      addToast(`Удалено записей: ${deleted}`, 'success');
    } catch { addToast('Не удалось удалить записи', 'error'); }
  };

  if (count === 0) return null;

  return (
    <Button disabled={loading} variant="danger" className={styles.button} onClick={handleClick}>
      Удалить выбранные ({count})
    </Button>
  );
}
