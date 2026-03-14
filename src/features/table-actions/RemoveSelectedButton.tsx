import { useUsersStore } from '@/app/store/users-store';
import { useToastsStore } from '@/app/store/toasts-store';
import { Button } from '@/shared/ui/button/Button';
import styles from './RemoveSelectedButton.module.css';

export function RemoveSelectedButton() {
  const { selectedIds, removeSelected } = useUsersStore();
  const addToast = useToastsStore((s) => s.addToast);
  const count = selectedIds.length;

  const handleClick = () => {
    if (count === 0) return;
    removeSelected();
    addToast(`Удалено записей: ${count}`, 'success');
  };

  if (count === 0) return null;

  return (
    <Button variant="danger" className={styles.button} onClick={handleClick}>
      Удалить выбранные ({count})
    </Button>
  );
}
