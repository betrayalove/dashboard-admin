import { useEffect } from 'react';
import { useUsersStore } from '@/app/store/users-store';
import { RemoveSelectedButton } from '@/features/table-actions/RemoveSelectedButton';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Skeleton } from '@/shared/ui/skeleton/Skeleton';
import styles from './UsersTablePage.module.css';

const COLS = ['id', 'name', 'email', 'role', 'createdAt'] as const;
const LABELS: Record<string, string> = {
  id: 'ID',
  name: 'Имя',
  email: 'Email',
  role: 'Роль',
  createdAt: 'Дата',
};

export function UsersTablePage() {
  const {
    items,
    total,
    page,
    limit,
    sort,
    order,
    selectedIds,
    loading,
    error,
    fetchUsers,
    setPage,
    setSort,
    toggleSelect,
    toggleSelectAll,
  } = useUsersStore();

  useEffect(() => {
    fetchUsers().catch(() => {});
  }, [fetchUsers, page, limit, sort, order]);

  const totalPages = Math.ceil(total / limit) || 1;
  const allSelected = items.length > 0 && items.every((u) => selectedIds.includes(u.id));

  if (error) {
    return (
      <div className={styles.errorBlock} role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Пользователи</h1>
        <RemoveSelectedButton />
      </div>

      <Card className={styles.tableCard}>
        {loading && items.length === 0 ? (
          <div className={styles.skeletonWrap}>
            <Skeleton height={40} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={48} />
            ))}
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thCheck}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Выбрать все"
                      />
                    </th>
                    {COLS.map((col) => (
                      <th
                        key={col}
                        className={styles.th}
                        onClick={() => setSort(col)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSort(col)}
                      >
                        {LABELS[col]}
                        {sort === col && <span className={styles.arrow}>{order === 'asc' ? ' ↑' : ' ↓'}</span>}
                      </th>
                    ))}
                    <th className={styles.th}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 2} className={styles.empty}>
                        Нет данных
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id}>
                        <td className={styles.tdCheck}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            aria-label={`Выбрать ${row.name}`}
                          />
                        </td>
                        <td className={styles.td}>{row.id}</td>
                        <td className={styles.td}>{row.name}</td>
                        <td className={styles.td}>{row.email}</td>
                        <td className={styles.td}>{row.role}</td>
                        <td className={styles.td}>{row.createdAt}</td>
                        <td className={styles.td}>—</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Назад
              </Button>
              <span className={styles.paginationInfo}>
                Страница {page} из {totalPages} (всего {total})
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Вперёд
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
