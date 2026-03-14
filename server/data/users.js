let users = [
  { id: 1, name: 'Алексей Иванов', email: 'alex@example.com', role: 'admin', createdAt: '2024-01-15' },
  { id: 2, name: 'Мария Петрова', email: 'maria@example.com', role: 'user', createdAt: '2024-02-20' },
  { id: 3, name: 'Дмитрий Сидоров', email: 'dmitry@example.com', role: 'editor', createdAt: '2024-03-10' },
  { id: 4, name: 'Елена Козлова', email: 'elena@example.com', role: 'user', createdAt: '2024-04-05' },
  { id: 5, name: 'Игорь Новиков', email: 'igor@example.com', role: 'user', createdAt: '2024-05-12' },
  { id: 6, name: 'Ольга Морозова', email: 'olga@example.com', role: 'editor', createdAt: '2024-06-01' },
  { id: 7, name: 'Павел Волков', email: 'pavel@example.com', role: 'admin', createdAt: '2024-06-15' },
  { id: 8, name: 'Светлана Соколова', email: 'svetlana@example.com', role: 'user', createdAt: '2024-07-20' },
  { id: 9, name: 'Николай Лебедев', email: 'nikolay@example.com', role: 'user', createdAt: '2024-08-03' },
  { id: 10, name: 'Анна Кузнецова', email: 'anna@example.com', role: 'editor', createdAt: '2024-09-11' },
  { id: 11, name: 'Виктор Попов', email: 'viktor@example.com', role: 'user', createdAt: '2024-10-01' },
  { id: 12, name: 'Татьяна Михайлова', email: 'tatyana@example.com', role: 'user', createdAt: '2024-11-05' },
];

const SORT_KEYS = ['id', 'name', 'email', 'role', 'createdAt'];

export function getUsers({ page = 1, limit = 10, sort = 'name', order = 'asc' } = {}) {
  const orderMult = order === 'desc' ? -1 : 1;
  const sortKey = SORT_KEYS.includes(sort) ? sort : 'name';
  const sorted = [...users].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') return orderMult * (aVal - bVal);
    return orderMult * String(aVal).localeCompare(String(bVal));
  });
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);
  return { items, total: users.length, page, limit, sort: sortKey, order };
}

export function deleteUsers(ids) {
  users = users.filter((u) => !ids.includes(u.id));
  return users;
}
